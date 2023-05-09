from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from bson.objectid import ObjectId as BsonObjectId

#Unique ID setup
class PydanticObjectId(BsonObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, BsonObjectId):
            raise TypeError("Object ID necessary")
        return str(v)

# User model
class User(BaseModel):
    username: str
    email: EmailStr
    password: str

class NewUser(User):
    id: PydanticObjectId = Field(..., alias="_id")


# Project model
class NewProject(BaseModel):
    name: str
    description: Optional[str]

class Project(NewProject):
    id: PydanticObjectId = Field(..., alias="_id")


# Image model
class NewImage(BaseModel):
    name: str
    file_type: str
    date_uploaded: str
    path: str

class Image(NewImage):
    id: PydanticObjectId = Field(..., alias="_id")

"""

# Model model
class NewModel(BaseModel):
    name: str = Field(...)
    file_type: str = Field(...)
    date_uploaded: str = Field(...)
    project_id: int = Field(...)

class Model(NewModel):
    id: PydanticObjectId = Field(..., alias="_id")


# Annotation model
class NewAnnotation(BaseModel):
    user_id: int = Field(...)
    image_id: int = Field(...)
    project_id: int = Field(...)

class Annotation(NewAnnotation):
    id: PydanticObjectId = Field(..., alias="_id")

# Ranking model
class NewRanking(BaseModel):
    user_id: int = Field(...)
    image_id: int = Field(...)
    project_id: int = Field(...)
    score: int = Field(...)

class Ranking(NewRanking):
    id: PydanticObjectId = Field(..., alias="_id")
"""
