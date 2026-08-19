import requests

payload = {
    'customer_id': 1, 
    'destination': 'vizag', 
    'check_in': '2026-08-20', 
    'check_out': '2026-08-22', 
    'guests': 2, 
    'room_type': 'Deluxe', 
    'budget': 8000, 
    'purpose': 'Leisure', 
    'preferences': ''
}

res = requests.post('http://localhost:8080/api/leads', json=payload)
print(res.status_code)
try:
    print(res.json())
except Exception as e:
    print(res.text)
