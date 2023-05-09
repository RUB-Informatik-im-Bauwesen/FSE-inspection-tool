from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("monodb://localhost:27018", username="root", password="example")

db = client.test

collection_users = db.users