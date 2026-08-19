import requests
try:
    res = requests.post("http://localhost:8000/api/hotels/register", json={
        "name": "Test Hotel 2",
        "location": "Loc",
        "email": "test6@gmail.com",
        "password": "test",
        "photos": [],
        "rooms": [{"room_type": "Single", "quantity": 1, "price_per_night": 100}]
    })
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
