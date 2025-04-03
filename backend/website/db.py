from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://mongowork1", username="root", password="example")
# connection_string = "mongodb+srv://doadmin:Zp6d2435WqI871wC@db-mongodb-nyc3-07525-ba1be18f.mongo.ondigitalocean.com/admin?tls=true&authSource=admin"
# client = AsyncIOMotorClient(connection_string)
db = client.test

collection_users = db.users
collection_projects = db.projects
collection_images = db.images
collection_models = db.models
collection_annotations = db.annotations
collection_rankings = db.rankings
collection_jsons = db.jsons
collection_temp_images = db.temp_images
collection_result_images = db.result_images