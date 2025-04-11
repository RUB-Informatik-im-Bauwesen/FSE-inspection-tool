# syntax=docker/dockerfile:experimental
FROM --platform=linux/x86_64 python:3.9

WORKDIR /code

COPY ./requirements_docker.txt /code/requirements.txt

RUN pip3 install --upgrade pip

RUN --mount=type=cache,target=/root/.cache/pip pip3 install -r requirements.txt

RUN apt-get update && apt-get install -y python3-opencv
RUN pip install opencv-python

COPY ./backend /code/backend
COPY ./storage /code/storage
COPY ./yolov_5 /code/yolov_5
COPY ./ultralytics_yolov5_master /root/.cache/torch/hub/ultralytics_yolov5_master
COPY ./labels.yaml /code/labels.yaml

CMD ["uvicorn","backend.website.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]