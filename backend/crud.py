from fastapi import FastAPI, Depends
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi.middleware.cors import CORSMiddleware
from backend.db import collection_users, collection_annotations, collection_images, collection_projects, collection_rankings
from backend.models import User, Project
from bson.objectid import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

async def create_user(user):
    user = dict(user)
    document = await collection_users.find_one({"username": user["username"]})
    if document:
        raise HTTPException(status_code=409, detail="User already registered")
    document = await collection_users.find_one({"email": user["email"]})
    if document:
        raise HTTPException(status_code=409, detail="Email already registered")
    await collection_users.insert_one(user)


async def create_project(project, user):
  document = dict(project, **{"username": user["username"]})
  await collection_projects.insert_one(document)

async def update_project(id, name, description, user):
    try:
        document = await collection_projects.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    updated_project = await collection_projects.find_one_and_update({"_id": ObjectId(id)}, {"$set": {"name": name,"description":description}})
    return updated_project

async def delete_project(id, user):
    try:
        document = await collection_projects.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    document = await collection_projects.find_one_and_delete({"_id": ObjectId(id)})
    return document

async def fetch_projects_by_user(user):
    projects = []
    cursor = collection_projects.find({"username": user})
    async for document in cursor:
        project = Project(**document)
        projects.append(project)
    return projects

async def upload_image(id, image, user):
  document = dict(image, **{"username": user["username"], "project_id": id})
  await collection_images.insert_one(document)
  return document

async def update_image(id, image, user):
    doc = dict(image)
    try:
        document = await collection_images.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    updated_image = await collection_images.find_one_and_update({"_id": ObjectId(id)}, {"$set": {"name": doc["name"], "file_type": doc["file_type"], "date_uploaded":doc["date_uploaded"], "path":doc["path"]}})
    return updated_image

async def delete_image(id, user):
    try:
        document = await collection_images.find_one({"_id": ObjectId(id)})
    except InvalidId:
        raise HTTPException(
            status_code=422, detail="Id not in the right format")
    if not document:
        raise HTTPException(status_code=404, detail="ID not found")
    if user["username"] != document["username"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    document = await collection_images.find_one_and_delete({"_id": ObjectId(id)})
    return document

async def fetch_images_by_user(user):
    images = []
    cursor = collection_images.find({"username": user})
    async for document in cursor:
        image = Project(**document)
        images.append(image)
    return images

async def fetch_images_by_projects(id):
    images = []
    cursor = collection_images.find({"project_id": ObjectId(id)})
    async for document in cursor:
        image = Project(**document)
        images.append(image)
    return images