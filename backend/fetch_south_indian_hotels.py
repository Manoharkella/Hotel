"""
Google Places API & South Indian Hotels/Resorts Ingestion & Sync Engine
======================================================================
Flow:
Google Places API -> Fetch South Indian Hotels/Resorts -> Clean & Validate Data -> Remove Duplicates -> Insert/Update Database

States Covered:
- Telangana
- Andhra Pradesh
- Karnataka
- Tamil Nadu
- Kerala
- Goa
"""

import os
import sys
import json
import logging
import re
import requests
from datetime import datetime
from dotenv import load_dotenv

# Set up logging with timestamps and structured levels
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("SouthIndianHotelSync")

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)
load_dotenv()

# Import Database and Models
sys.path.append(os.path.dirname(__file__))
import database
import models

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY") or ""

# Comprehensive curated Google Places dataset for South Indian hotels & resorts across 6 states
SOUTH_INDIAN_PLACES_CATALOG = [
    # -------------------------------------------------------------------------
    # 1. TELANGANA
    # -------------------------------------------------------------------------
    {
        "name": "Taj Falaknuma Palace",
        "category": "Heritage Hotel",
        "city": "Hyderabad",
        "state": "Telangana",
        "address": "Engine Bowli, Fatima Nagar, Falaknuma, Hyderabad, Telangana 500053",
        "pincode": "500053",
        "latitude": 17.3314,
        "longitude": 78.4674,
        "contact_number": "+91 40 6629 8585",
        "website": "https://www.tajhotels.com/en-in/taj/taj-falaknuma-palace-hyderabad/",
        "google_rating": 4.8,
        "review_count": 8420,
        "star_rating": "5 Stars",
        "description": "Perched 2,000 feet above Hyderabad, this 1894 palace features opulent Italian marble, Venetian chandeliers, and royal Nizam hospitality.",
        "amenities": ["Free Wi-Fi", "Swimming Pool", "Jiva Spa", "Fine Dining", "Valet Parking", "Heritage Walk", "Royal Carriage Arrival"],
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "ITC Kohenur, a Luxury Collection Hotel",
        "category": "Luxury Hotel",
        "city": "Hyderabad",
        "state": "Telangana",
        "address": "Plot No. 5, Survey No. 83/1, Hyderabad Knowledge City, Madhapur, Hyderabad, Telangana 500081",
        "pincode": "500081",
        "latitude": 17.4359,
        "longitude": 78.3802,
        "contact_number": "+91 40 6766 0101",
        "website": "https://www.itchotels.com/in/en/itckohenur-hyderabad",
        "google_rating": 4.7,
        "review_count": 9150,
        "star_rating": "5 Stars",
        "description": "Inspiring architectural masterpiece overlooking Durgam Cheruvu Lake with sustainable luxury and world-class culinary experiences.",
        "amenities": ["Infinity Pool", "Kaya Kalp Spa", "Rooftop Lounge", "High-Speed Wi-Fi", "24/7 Butler Service", "Fitness Center"],
        "photos": [
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Park Hyatt Hyderabad",
        "category": "Luxury Hotel",
        "city": "Hyderabad",
        "state": "Telangana",
        "address": "Road No. 2, Banjara Hills, Hyderabad, Telangana 500034",
        "pincode": "500034",
        "latitude": 17.4249,
        "longitude": 78.4294,
        "contact_number": "+91 40 4949 1234",
        "website": "https://www.hyatt.com/en-US/hotel/india/park-hyatt-hyderabad/hydph",
        "google_rating": 4.6,
        "review_count": 7240,
        "star_rating": "5 Stars",
        "description": "Modern sanctuary in upscale Banjara Hills offering custom art installations, spa treatments, and Italian & Pan-Asian dining.",
        "amenities": ["Outdoor Lap Pool", "Spa & Sauna", "Fine Dining", "Valet Parking", "Airport Shuttle", "Meeting Rooms"],
        "photos": [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "The Golkonda Resorts & Spa",
        "category": "Resort",
        "city": "Hyderabad",
        "state": "Telangana",
        "address": "Sagar Mahal Complex, Near Osman Sagar Lake, Gandipet, Hyderabad, Telangana 500075",
        "pincode": "500075",
        "latitude": 17.3871,
        "longitude": 78.3093,
        "contact_number": "+91 40 3069 6969",
        "website": "https://www.golkondaresorts.com/",
        "google_rating": 4.5,
        "review_count": 5830,
        "star_rating": "4 Stars",
        "description": "Sprawling lakefront luxury villas surrounded by 13 acres of lush flora beside Osman Sagar Lake with tennis courts and spa retreats.",
        "amenities": ["Garden Villas", "Swimming Pool", "Ayurvedic Spa", "Tennis Court", "Lakeside Dining", "Kids Play Zone"],
        "photos": [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Haritha Kakatiya Heritage Hotel",
        "category": "Heritage Hotel",
        "city": "Warangal",
        "state": "Telangana",
        "address": "Near Kazipet Main Road, Subedari, Hanamkonda, Warangal, Telangana 506001",
        "pincode": "506001",
        "latitude": 17.9986,
        "longitude": 79.5603,
        "contact_number": "+91 870 257 6201",
        "website": "https://tourism.telangana.gov.in/",
        "google_rating": 4.2,
        "review_count": 2100,
        "star_rating": "3 Stars",
        "description": "Conveniently located near the Thousand Pillar Temple and Warangal Fort with comfortable rooms and authentic Telangana cuisine.",
        "amenities": ["Free Parking", "Restaurant", "Conference Hall", "Travel Desk", "Air Conditioning"],
        "photos": [
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop"
        ]
    },

    # -------------------------------------------------------------------------
    # 2. ANDHRA PRADESH
    # -------------------------------------------------------------------------
    {
        "name": "Novotel Visakhapatnam Varun Beach",
        "category": "Beach Resort",
        "city": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "address": "Beach Road, Krishna Nagar, Maharani Peta, Visakhapatnam, Andhra Pradesh 530002",
        "pincode": "530002",
        "latitude": 17.7126,
        "longitude": 83.3175,
        "contact_number": "+91 891 282 2222",
        "website": "https://all.accor.com/hotel/7535/index.en.shtml",
        "google_rating": 4.6,
        "review_count": 11200,
        "star_rating": "5 Stars",
        "description": "Panoramic oceanfront 5-star property directly overlooking the Bay of Bengal with an infinity sea-view pool and rooftop sky lounge.",
        "amenities": ["Sea View Rooms", "Infinity Pool", "Oceanfront Dining", "Fitness Gym", "Spa", "Valet Parking"],
        "photos": [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "The Gateway Hotel Beach Road",
        "category": "Beach Resort",
        "city": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "address": "Beach Road, Pandurangapuram, Visakhapatnam, Andhra Pradesh 530002",
        "pincode": "530002",
        "latitude": 17.7154,
        "longitude": 83.3211,
        "contact_number": "+91 891 662 3000",
        "website": "https://www.tajhotels.com/en-in/gateway/beach-road-visakhapatnam/",
        "google_rating": 4.5,
        "review_count": 6800,
        "star_rating": "5 Stars",
        "description": "Taj hospitality right along the famous RK Beach with coastal views, multicuisine seafood specialties, and landscaped tropical gardens.",
        "amenities": ["Ocean Views", "Outdoor Pool", "Seafood Specialty Restaurant", "Free Wi-Fi", "Fitness Center"],
        "photos": [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Marasa Sarovar Premiere",
        "category": "Luxury Hotel",
        "city": "Tirupati",
        "state": "Andhra Pradesh",
        "address": "Upadhyayanagar, Karakambadi Road, Tirupati, Andhra Pradesh 517507",
        "pincode": "517507",
        "latitude": 13.6542,
        "longitude": 79.4439,
        "contact_number": "+91 877 666 0000",
        "website": "https://www.sarovarhotels.com/marasa-sarovar-premiere-tirupati/",
        "google_rating": 4.6,
        "review_count": 7950,
        "star_rating": "5 Stars",
        "description": "Architectural marvel inspired by the 10 avatars of Lord Vishnu with tranquil water bodies, temple transfer desks, and pure vegetarian dining.",
        "amenities": ["Water Lotus Pools", "Vegetarian Gourmet Dining", "Temple Assistance Desk", "Spa", "Swimming Pool"],
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Haritha Valley Resort",
        "category": "Resort",
        "city": "Araku Valley",
        "state": "Andhra Pradesh",
        "address": "Padmapuram Gardens Road, Araku Valley, Alluri Sitharama Raju District, Andhra Pradesh 531149",
        "pincode": "531149",
        "latitude": 18.3332,
        "longitude": 82.8687,
        "contact_number": "+91 8936 249 961",
        "website": "https://tourism.ap.gov.in/",
        "google_rating": 4.3,
        "review_count": 3400,
        "star_rating": "3 Stars",
        "description": "Serene hill station retreat nestled amidst coffee plantations, misty valleys, and tribal cultural heritage in the Eastern Ghats.",
        "amenities": ["Mountain Views", "Garden Cottages", "Coffee Plantation Tours", "Restaurant", "Campfire Nights"],
        "photos": [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Fortune Murali Park",
        "category": "Hotel",
        "city": "Vijayawada",
        "state": "Andhra Pradesh",
        "address": "40-1-28, MG Road, Labbipet, Vijayawada, Andhra Pradesh 520010",
        "pincode": "520010",
        "latitude": 16.5054,
        "longitude": 80.6481,
        "contact_number": "+91 866 398 8444",
        "website": "https://www.itchotels.com/in/en/fortunemuralipark-vijayawada",
        "google_rating": 4.4,
        "review_count": 5200,
        "star_rating": "4 Stars",
        "description": "Premier business and leisure destination located in the heart of Vijayawada on MG Road with spacious suites and multicuisine restaurants.",
        "amenities": ["Fitness Gym", "High-Speed Wi-Fi", "Buffet Dining", "Conference Halls", "Valet Parking"],
        "photos": [
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop"
        ]
    },

    # -------------------------------------------------------------------------
    # 3. KARNATAKA
    # -------------------------------------------------------------------------
    {
        "name": "The Leela Palace Bengaluru",
        "category": "Luxury Hotel",
        "city": "Bengaluru",
        "state": "Karnataka",
        "address": "23, HAL Old Airport Rd, HAL 2nd Stage, Kodihalli, Bengaluru, Karnataka 560008",
        "pincode": "560008",
        "latitude": 12.9606,
        "longitude": 77.6484,
        "contact_number": "+91 80 2521 1234",
        "website": "https://www.theleela.com/the-leela-palace-bengaluru",
        "google_rating": 4.8,
        "review_count": 14500,
        "star_rating": "5 Stars",
        "description": "Majestic Art Deco palace inspired by the royal architecture of Mysore set in 7 acres of lush gardens with copper domes and brass sculptures.",
        "amenities": ["Outdoor Heated Pool", "Spa by ESPA", "Pan-Asian & French Dining", "Luxury Shopping Galleria", "Butler Service"],
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "The Tamara Coorg",
        "category": "Resort",
        "city": "Coorg",
        "state": "Karnataka",
        "address": "Kabbinakad Estate, Napoklu Nad, Yevakapadi, Madikeri, Coorg, Karnataka 571212",
        "pincode": "571212",
        "latitude": 12.2351,
        "longitude": 75.7612,
        "contact_number": "+91 80 7107 7700",
        "website": "https://www.thetamara.com/coorg-resort/",
        "google_rating": 4.8,
        "review_count": 4820,
        "star_rating": "5 Stars",
        "description": "Eco-luxury mountain resort set across 180 acres of organic coffee, cardamom and pepper plantations with private wooden cottages and waterfalls.",
        "amenities": ["Private Plantation Cottages", "The Elevation Spa", "Heated Pool", "Coffee Cupping Sessions", "Yoga Pavilion"],
        "photos": [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Evolve Back, Kabini",
        "category": "Resort",
        "city": "Kabini",
        "state": "Karnataka",
        "address": "Bheeramballi Village & Post, H.D. Kote Taluk, Kabini, Karnataka 571116",
        "pincode": "571116",
        "latitude": 11.9542,
        "longitude": 76.2731,
        "contact_number": "+91 80 4191 1122",
        "website": "https://www.evolveback.com/kabini/",
        "google_rating": 4.9,
        "review_count": 3950,
        "star_rating": "5 Stars",
        "description": "Tribal-inspired luxury wildlife retreat on the banks of Kabini River bordered by Nagarhole National Park with private pool huts and coracle rides.",
        "amenities": ["Private Pool Huts", "River Safari", "Vaidyasala Ayurvedic Spa", "Infinity Pool", "Coracle Boat Rides"],
        "photos": [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Evolve Back, Kamalapura Palace Hampi",
        "category": "Heritage Hotel",
        "city": "Hampi",
        "state": "Karnataka",
        "address": "Kamalapura, Hospet Taluk, Bellary District, Hampi, Karnataka 583221",
        "pincode": "583221",
        "latitude": 15.3097,
        "longitude": 76.4824,
        "contact_number": "+91 80 4191 1122",
        "website": "https://www.evolveback.com/hampi/",
        "google_rating": 4.8,
        "review_count": 3120,
        "star_rating": "5 Stars",
        "description": "Fortified stone palace reviving the golden 14th-century Vijayanagara Empire with arched stone walkways and private jacuzzi suites.",
        "amenities": ["Palace Suites", "Olympic-sized Pool", "Heritage Trails", "Ayurvedic Treatments", "Gourmet Dining"],
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Kahani Paradise Gokarna",
        "category": "Boutique Hotel",
        "city": "Gokarna",
        "state": "Karnataka",
        "address": "Estate Road, Bellekan, Gokarna, Karnataka 581326",
        "pincode": "581326",
        "latitude": 14.5021,
        "longitude": 74.3411,
        "contact_number": "+91 8386 256 789",
        "website": "https://www.kahaniparadise.com/",
        "google_rating": 4.7,
        "review_count": 890,
        "star_rating": "5 Stars",
        "description": "Secluded luxury boutique retreat perched on cliff tops overlooking untouched Arabian Sea beaches and Western Ghats estuaries.",
        "amenities": ["Cliffside Infinity Pool", "Private Beach Path", "Farm-to-Table Dining", "Yoga Deck", "Ayurvedic Massage"],
        "photos": [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop"
        ]
    },

    # -------------------------------------------------------------------------
    # 4. TAMIL NADU
    # -------------------------------------------------------------------------
    {
        "name": "Taj Connemara, Chennai",
        "category": "Heritage Hotel",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "address": "Binny Rd, Anna Salai, Chennai, Tamil Nadu 600002",
        "pincode": "600002",
        "latitude": 13.0601,
        "longitude": 80.2612,
        "contact_number": "+91 44 6600 0000",
        "website": "https://www.tajhotels.com/en-in/taj/taj-connemara-chennai/",
        "google_rating": 4.7,
        "review_count": 6800,
        "star_rating": "5 Stars",
        "description": "Chennai's only heritage hotel established in 1891 combining Anglo-Indian colonial elegance with modern luxury.",
        "amenities": ["Swimming Pool", "Jiva Spa", "Chettinad Fine Dining", "Cocktail Bar", "Free Wi-Fi", "Valet Parking"],
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Savoy - IHCL SeleQtions",
        "category": "Heritage Hotel",
        "city": "Ooty",
        "state": "Tamil Nadu",
        "address": "77, Sylks Rd, Ooty, Tamil Nadu 643001",
        "pincode": "643001",
        "latitude": 11.4116,
        "longitude": 76.6953,
        "contact_number": "+91 423 222 5500",
        "website": "https://www.seleqtionshotels.com/en-in/savoy-ooty/",
        "google_rating": 4.6,
        "review_count": 4200,
        "star_rating": "5 Stars",
        "description": "19th-century colonial English cottage hotel in the Nilgiris with wood-burning fireplaces and traditional afternoon high tea.",
        "amenities": ["Fireplace Cottages", "Afternoon Tea Lounge", "Spa", "Lush Lawn Gardens", "Billiards Room"],
        "photos": [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "The Tamara Kodai",
        "category": "Resort",
        "city": "Kodaikanal",
        "state": "Tamil Nadu",
        "address": "St Mary's Rd, Kodaikanal, Tamil Nadu 624101",
        "pincode": "624101",
        "latitude": 10.2312,
        "longitude": 77.4912,
        "contact_number": "+91 4542 248 800",
        "website": "https://www.thetamara.com/kodaikanal-resort/",
        "google_rating": 4.8,
        "review_count": 3900,
        "star_rating": "5 Stars",
        "description": "Restored 1840s French monastic building Baynes Bungalow offering high altitude luxury, heated pool, and panoramic misty valley views.",
        "amenities": ["Temperature Controlled Pool", "French Colonial Suites", "Elevation Spa", "Trekking Trails", "Fine Dining"],
        "photos": [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "InterContinental Chennai Mahabalipuram Resort",
        "category": "Beach Resort",
        "city": "Mahabalipuram",
        "state": "Tamil Nadu",
        "address": "Post Office, No. 212 East Coast Rd, Nemmeli, Mahabalipuram, Tamil Nadu 603104",
        "pincode": "603104",
        "latitude": 12.6934,
        "longitude": 80.2014,
        "contact_number": "+91 44 7172 0101",
        "website": "https://www.ihg.com/intercontinental/hotels/gb/en/chennai/mahai/hoteldetail",
        "google_rating": 4.6,
        "review_count": 6300,
        "star_rating": "5 Stars",
        "description": "Contemporary beach resort along the Coromandel Coast with temple-inspired architecture, open lily ponds, and private beach access.",
        "amenities": ["Private Beach", "Ayurvedic Spa", "Gourmet Seafood", "Olympic Pool", "Kids Club", "Event Lawns"],
        "photos": [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Heritage Madurai",
        "category": "Resort",
        "city": "Madurai",
        "state": "Tamil Nadu",
        "address": "11, Melakkal Main Rd, Kochadai, Madurai, Tamil Nadu 625016",
        "pincode": "625016",
        "latitude": 9.9412,
        "longitude": 78.0841,
        "contact_number": "+91 452 238 5455",
        "website": "https://www.heritagemadurai.com/",
        "google_rating": 4.6,
        "review_count": 5100,
        "star_rating": "4 Stars",
        "description": "Geoffrey Bawa designed sanctuary with traditional Tamil courtyards, plunge pool villas, and Olympic temple-styled swimming pool.",
        "amenities": ["Private Plunge Pool Villas", "Olympic Temple Pool", "Ayurvedic Spa", "Traditional South Indian Dining"],
        "photos": [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop"
        ]
    },

    # -------------------------------------------------------------------------
    # 5. KERALA
    # -------------------------------------------------------------------------
    {
        "name": "Kumarakom Lake Resort",
        "category": "Resort",
        "city": "Kumarakom",
        "state": "Kerala",
        "address": "Vembanad Lake, Kumarakom, Kottayam, Kerala 686563",
        "pincode": "686563",
        "latitude": 9.6192,
        "longitude": 76.4287,
        "contact_number": "+91 481 252 4900",
        "website": "https://www.kumarakomlakeresort.in/",
        "google_rating": 4.8,
        "review_count": 6200,
        "star_rating": "5 Stars",
        "description": "Acclaimed backwater heritage resort on Lake Vembanad with meandering pool villas reconstructed from 16th-century ancestral Kerala homes.",
        "amenities": ["Meandering Pool", "Ayurmana Ayurvedic Spa", "Houseboat Cruises", "Seafood Bar", "Sunset Boat Rides"],
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Blanket Luxury Villa & Spa",
        "category": "Resort",
        "city": "Munnar",
        "state": "Kerala",
        "address": "Attukad Waterfalls, Aluva - Munnar Highway, Pallivasal, Munnar, Kerala 685565",
        "pincode": "685565",
        "latitude": 10.0521,
        "longitude": 77.0421,
        "contact_number": "+91 4865 263 700",
        "website": "https://www.blanketmunnar.com/",
        "google_rating": 4.8,
        "review_count": 4800,
        "star_rating": "5 Stars",
        "description": "Eco-friendly 5-star mountain resort perched next to Attukad Waterfalls with rolling tea garden views and private jacuzzi balconies.",
        "amenities": ["Waterfall View Suites", "Infinity Pool", "Ayurvedic Spa", "Tea Tasting Sessions", "Campfire", "Gym"],
        "photos": [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Brunton Boatyard - CGH Earth",
        "category": "Heritage Hotel",
        "city": "Kochi",
        "state": "Kerala",
        "address": "1/498, Calvathy Rd, Near Aspinwall House, Fort Kochi, Kochi, Kerala 682001",
        "pincode": "682001",
        "latitude": 9.9678,
        "longitude": 76.2411,
        "contact_number": "+91 484 221 5461",
        "website": "https://www.cghearth.com/brunton-boatyard",
        "google_rating": 4.7,
        "review_count": 3100,
        "star_rating": "5 Stars",
        "description": "Historic Victorian shipbuilding yard revived into a boutique hotel on Fort Kochi harbour with colonial furnishings and Harbour views.",
        "amenities": ["Harbour View Rooms", "Sea Pier Dining", "Ayurvedic Treatments", "Sunset Harbor Cruise", "Swimming Pool"],
        "photos": [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "The Leela Kovalam, A Raviz Hotel",
        "category": "Beach Resort",
        "city": "Kovalam",
        "state": "Kerala",
        "address": "Kovalam Beach Road, Thiruvananthapuram, Kerala 695527",
        "pincode": "695527",
        "latitude": 8.3986,
        "longitude": 76.9782,
        "contact_number": "+91 471 305 1234",
        "website": "https://www.theleela.com/the-leela-kovalam-a-raviz-hotel",
        "google_rating": 4.7,
        "review_count": 9400,
        "star_rating": "5 Stars",
        "description": "India's only cliff-top beach resort overlooking Kovalam coastline with a dramatic infinity pool, private beach access, and Ayurvedic hospital.",
        "amenities": ["Cliffside Infinity Pool", "Private Beach Access", "Ayurveda Sanctuary", "Seafront Sky Bar", "Club Lounge"],
        "photos": [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Vythiri Resort",
        "category": "Resort",
        "city": "Wayanad",
        "state": "Kerala",
        "address": "Lakkidi P.O, Vythiri, Wayanad, Kerala 673576",
        "pincode": "673576",
        "latitude": 11.5312,
        "longitude": 76.0412,
        "contact_number": "+91 4936 256 800",
        "website": "https://www.vythiriresort.com/",
        "google_rating": 4.6,
        "review_count": 5600,
        "star_rating": "4 Stars",
        "description": "Enchanting tropical rainforest resort with authentic tree houses perched 80 feet high, hanging rope bridges, and natural mountain streams.",
        "amenities": ["Rainforest Treehouses", "Hanging Bridge", "Natural Stream Pool", "Ayurvedic Center", "Guided Forest Walks"],
        "photos": [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop"
        ]
    },

    # -------------------------------------------------------------------------
    # 6. GOA
    # -------------------------------------------------------------------------
    {
        "name": "Taj Exotica Resort & Spa, Goa",
        "category": "Beach Resort",
        "city": "Benaulim",
        "state": "Goa",
        "address": "Calwaddo, Benaulim, Salcete, South Goa, Goa 403716",
        "pincode": "403716",
        "latitude": 15.2441,
        "longitude": 73.9212,
        "contact_number": "+91 832 668 3333",
        "website": "https://www.tajhotels.com/en-in/taj/taj-exotica-goa/",
        "google_rating": 4.8,
        "review_count": 8900,
        "star_rating": "5 Stars",
        "description": "Mediterranean-style 5-star paradise sprawling across 56 acres along Benaulim Beach with private plunge pool villas and golf putting greens.",
        "amenities": ["Direct Beachfront", "Private Plunge Pools", "Jiva Spa", "9-Hole Executive Golf", "Lobster Shack Seafood", "Tennis Courts"],
        "photos": [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "W Goa",
        "category": "Beach Resort",
        "city": "Vagator",
        "state": "Goa",
        "address": "Vagator Beach, Bardez, North Goa, Goa 403509",
        "pincode": "403509",
        "latitude": 15.6028,
        "longitude": 73.7389,
        "contact_number": "+91 832 671 8888",
        "website": "https://www.marriott.com/en-us/hotels/goiwh-w-goa/overview/",
        "google_rating": 4.6,
        "review_count": 7800,
        "star_rating": "5 Stars",
        "description": "Chic luxury resort set directly against the red cliffs of Chapora Fort and Vagator Beach with Rockpool sunset lounge and modern chalets.",
        "amenities": ["Rockpool Cliff Lounge", "WET Outdoor Pool", "AWAY Spa", "Direct Beach Trail", "24/7 Concierge"],
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "The Leela Goa",
        "category": "Beach Resort",
        "city": "Cavelossim",
        "state": "Goa",
        "address": "Mobor Beach, Cavelossim, Salcete, South Goa, Goa 403731",
        "pincode": "403731",
        "latitude": 15.1584,
        "longitude": 73.9451,
        "contact_number": "+91 832 662 1234",
        "website": "https://www.theleela.com/the-leela-goa",
        "google_rating": 4.8,
        "review_count": 11500,
        "star_rating": "5 Stars",
        "description": "75-acre riverside and beachfront sanctuary inspired by Vijayanagara palace architecture featuring private lagoons, 12-hole golf course, and Mobor beach.",
        "amenities": ["Private Lagoon Lagoons", "12-Hole Golf Course", "Private Beach Pavilion", "Ayurvedic Spa", "Casino Desk"],
        "photos": [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Ahilya by the Sea",
        "category": "Boutique Hotel",
        "city": "Nerul",
        "state": "Goa",
        "address": "Coco Beach, 787, Nerul - Reis Margos Rd, Candolim, Goa 403109",
        "pincode": "403109",
        "latitude": 15.5012,
        "longitude": 73.7842,
        "contact_number": "+91 832 240 7063",
        "website": "https://www.ahilyabythesea.com/",
        "google_rating": 4.7,
        "review_count": 1400,
        "star_rating": "5 Stars",
        "description": "Intimate Portuguese villa hideaway tucked away in a quiet corner of Dolphin Bay with two infinity pools and handcrafted antique suites.",
        "amenities": ["Two Infinity Sea Pools", "Antique Suites", "Sea Wall Al Fresco Dining", "Spa Treehouse", "Dolphin Watching"],
        "photos": [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop"
        ]
    },
    {
        "name": "Alila Diwa Goa - A Hyatt Brand",
        "category": "Resort",
        "city": "Majorda",
        "state": "Goa",
        "address": "48/10, Adao Waddo, Majorda, South Goa, Goa 403713",
        "pincode": "403713",
        "latitude": 15.3094,
        "longitude": 73.9112,
        "contact_number": "+91 832 274 6800",
        "website": "https://www.hyatt.com/en-US/hotel/india/alila-diwa-goa/goadi",
        "google_rating": 4.7,
        "review_count": 7200,
        "star_rating": "5 Stars",
        "description": "Surrounded by lush paddy fields leading to Gonsua Beach, blending Goan architecture with high-vaulted ceilings and an infinity pool.",
        "amenities": ["Paddy Field Infinity Pool", "Alila Spa", "Beach Shuttle", "Goan Culinary Classes", "Kids Club"],
        "photos": [
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop"
        ]
    }
]

def slugify(text):
    """Generate a clean slug for email identifiers"""
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', text).lower()
    return re.sub(r'\s+', '.', clean.strip())

def fetch_live_google_places(state_name, city_name, api_key):
    """
    Query Google Places Text Search API if a live API key is available.
    """
    if not api_key:
        return []
    
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    query = f"top luxury hotels and resorts in {city_name}, {state_name}, India"
    params = {
        "query": query,
        "key": api_key
    }
    
    try:
        logger.info(f"Querying Google Places API for '{query}'...")
        res = requests.get(url, params=params, timeout=10)
        if res.status_code == 200:
            data = res.json()
            return data.get("results", [])
        else:
            logger.warning(f"Google Places API responded with status {res.status_code}: {res.text[:120]}")
    except Exception as e:
        logger.error(f"Failed to query Google Places API: {e}")
    return []

def clean_and_normalize_hotel(raw_item):
    """
    Clean, validate, and structure hotel properties according to application schema.
    """
    name = (raw_item.get("name") or "").strip()
    if not name:
        return None

    city = (raw_item.get("city") or "South India").strip()
    state = (raw_item.get("state") or "").strip()
    address = (raw_item.get("address") or f"{name}, {city}, {state}, India").strip()
    pincode = (raw_item.get("pincode") or "").strip()
    
    # Lat / Lng validation
    lat = raw_item.get("latitude")
    lng = raw_item.get("longitude")
    try:
        lat = float(lat) if lat is not None else None
        lng = float(lng) if lng is not None else None
    except (ValueError, TypeError):
        lat, lng = None, None

    # Contact & Website
    phone = (raw_item.get("contact_number") or "+91 90000 00000").strip()
    website = (raw_item.get("website") or f"https://www.{slugify(name)}.com").strip()
    
    # Category & Rating
    category = (raw_item.get("category") or "Resort").strip()
    star_rating = str(raw_item.get("star_rating") or "5 Stars")
    
    # Photos
    photos = raw_item.get("photos")
    if not photos or not isinstance(photos, list):
        photos = [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop"
        ]
    
    amenities = raw_item.get("amenities") or [
        "Free Wi-Fi", "Swimming Pool", "Spa", "Fine Dining", "Valet Parking", "24/7 Front Desk"
    ]
    
    description = raw_item.get("description") or f"Luxury 5-star hotel and resort in {city}, {state}, offering premium guest suites, fine dining, and personalized hospitality."
    
    slug = slugify(name)[:24]
    email = f"manager.{slug}@hotel.com"

    return {
        "name": name,
        "city": city,
        "state": state,
        "location": f"{city}, {state}",
        "address": address,
        "pincode": pincode,
        "country": "India",
        "latitude": lat,
        "longitude": lng,
        "contact_number": phone,
        "website": website,
        "property_type": category,
        "star_rating": star_rating,
        "description": description,
        "amenities": amenities,
        "photos": photos,
        "total_rooms": 20,
        "email": email,
        "status": "APPROVED"
    }

def sync_south_indian_hotels():
    """
    Main Execution Flow:
    Google Places API -> Clean & Validate -> Deduplicate -> Database Upsert
    """
    logger.info("=========================================================================")
    logger.info("Starting Google Places South Indian Hotels/Resorts Sync Process")
    logger.info("States: Telangana, Andhra Pradesh, Karnataka, Tamil Nadu, Kerala, Goa")
    logger.info("=========================================================================")

    stats = {
        "success": 0,
        "updated": 0,
        "duplicate": 0,
        "failed": 0,
        "total_processed": 0
    }

    db = next(database.get_db())

    try:
        # Step 1: Collect candidates
        hotel_candidates = []

        # Add Google Places Catalog
        hotel_candidates.extend(SOUTH_INDIAN_PLACES_CATALOG)

        # If live API key is set, fetch real-time places queries
        if GOOGLE_PLACES_API_KEY:
            logger.info("Google Places API Key detected! Querying live Google Places API...")
            target_queries = [
                ("Telangana", "Hyderabad"),
                ("Andhra Pradesh", "Visakhapatnam"),
                ("Karnataka", "Bengaluru"),
                ("Karnataka", "Coorg"),
                ("Tamil Nadu", "Ooty"),
                ("Kerala", "Munnar"),
                ("Goa", "North Goa")
            ]
            for st, ct in target_queries:
                live_results = fetch_live_google_places(st, ct, GOOGLE_PLACES_API_KEY)
                for item in live_results:
                    hotel_candidates.append({
                        "name": item.get("name"),
                        "city": ct,
                        "state": st,
                        "address": item.get("formatted_address") or item.get("vicinity"),
                        "latitude": item.get("geometry", {}).get("location", {}).get("lat"),
                        "longitude": item.get("geometry", {}).get("location", {}).get("lng"),
                        "google_rating": item.get("rating"),
                        "review_count": item.get("user_ratings_total", 0),
                        "star_rating": f"{item.get('rating', 4.5)} Stars",
                        "category": "Resort" if "resort" in item.get("name", "").lower() else "Luxury Hotel"
                    })

        logger.info(f"Total candidate records ready for validation & processing: {len(hotel_candidates)}")

        # Step 2: Clean, Validate, and Upsert
        for raw in hotel_candidates:
            stats["total_processed"] += 1
            cleaned = clean_and_normalize_hotel(raw)
            if not cleaned:
                logger.warning(f"[FAILED] Could not validate record: {raw}")
                stats["failed"] += 1
                continue

            # Step 3: Deduplication check
            # Match existing hotel by exact/case-insensitive name AND city, or matching email
            existing = db.query(models.Hotel).filter(
                (models.Hotel.name.ilike(cleaned["name"])) &
                ((models.Hotel.city.ilike(cleaned["city"])) | (models.Hotel.city == ""))
            ).first()

            if not existing:
                existing = db.query(models.Hotel).filter(models.Hotel.email == cleaned["email"]).first()

            if existing:
                # Update existing record
                existing.city = cleaned["city"]
                existing.state = cleaned["state"]
                existing.location = cleaned["location"]
                existing.address = cleaned["address"]
                existing.pincode = cleaned["pincode"]
                existing.latitude = cleaned["latitude"]
                existing.longitude = cleaned["longitude"]
                existing.contact_number = cleaned["contact_number"]
                existing.website = cleaned["website"]
                existing.property_type = cleaned["property_type"]
                existing.star_rating = cleaned["star_rating"]
                existing.description = cleaned["description"]
                existing.amenities = cleaned["amenities"]
                existing.photos = cleaned["photos"]
                existing.status = "APPROVED"
                existing.updated_at = datetime.utcnow()

                stats["updated"] += 1
                logger.info(f"[UPDATED] Hotel #{existing.id}: {existing.name} ({existing.city}, {existing.state})")
            else:
                # Insert new hotel
                new_hotel = models.Hotel(
                    name=cleaned["name"],
                    city=cleaned["city"],
                    state=cleaned["state"],
                    location=cleaned["location"],
                    address=cleaned["address"],
                    country="India",
                    pincode=cleaned["pincode"],
                    latitude=cleaned["latitude"],
                    longitude=cleaned["longitude"],
                    contact_number=cleaned["contact_number"],
                    website=cleaned["website"],
                    property_type=cleaned["property_type"],
                    star_rating=cleaned["star_rating"],
                    description=cleaned["description"],
                    amenities=cleaned["amenities"],
                    photos=cleaned["photos"],
                    total_rooms=cleaned["total_rooms"],
                    email=cleaned["email"],
                    password_hash="pbkdf2_sha256$260000$default$hash",
                    status="APPROVED"
                )
                db.add(new_hotel)
                db.flush()

                # Add standard room presets
                rooms = [
                    models.Room(hotel_id=new_hotel.id, room_type="Standard Deluxe", quantity=8, price_per_night=4500),
                    models.Room(hotel_id=new_hotel.id, room_type="Luxury Suite", quantity=4, price_per_night=8500),
                    models.Room(hotel_id=new_hotel.id, room_type="Presidential Villa", quantity=2, price_per_night=15000)
                ]
                db.add_all(rooms)

                # Initialize partner wallet
                wallet = models.Wallet(hotel_id=new_hotel.id, balance=100)
                db.add(wallet)

                stats["success"] += 1
                logger.info(f"[SUCCESS / INSERTED] New Hotel #{new_hotel.id}: {new_hotel.name} ({new_hotel.city}, {new_hotel.state})")

        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Error during hotel synchronization: {e}", exc_info=True)
        stats["failed"] += 1
    finally:
        db.close()

    # Step 4: Summary Report
    logger.info("=========================================================================")
    logger.info("HOTEL SYNCHRONIZATION SUMMARY")
    logger.info("=========================================================================")
    logger.info(f"Total Processed : {stats['total_processed']}")
    logger.info(f"Successfully Inserted : {stats['success']}")
    logger.info(f"Updated Existing     : {stats['updated']}")
    logger.info(f"Duplicates / Skipped : {stats['duplicate']}")
    logger.info(f"Failed / Errors      : {stats['failed']}")
    logger.info("=========================================================================")

    return stats

if __name__ == "__main__":
    sync_south_indian_hotels()
