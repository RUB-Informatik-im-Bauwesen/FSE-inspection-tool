from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://mongowork", username="root", password="example")

db = client.test

collection_users = db.users
collection_projects = db.projects
collection_images = db.images
collection_models = db.models
collection_annotations = db.annotations
collection_rankings = db.rankings