import os
import subprocess
import pandas as pd
import shutil
import numpy as np
import random
import asyncio
from concurrent.futures import ThreadPoolExecutor
import torch
import cv2

def calculate_blurriness_score(image_path):
    # Load the image
    image = cv2.imread(image_path)

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Calculate the Laplacian variance of the grayscale image
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

    threshhold = 80
    weight = 1

    if laplacian_var <= threshhold:
        weight = 1

    return weight

def variation_ratio(data):
    ratios = []
    for sublist in data:
        counts = {}
        for item in sublist:
            counts[item] = counts.get(item, 0) + 1
        max_count = max(counts.values())
        ratio = 1-(1 - (max_count / len(sublist)))
        ratios.append(ratio)
    return ratios


def merge_subarrays_match(current,arr):
    merged = []
    while len(arr) > 0:
        # current = arr.pop(0)
        merged_with_current = [current]
        found = False
        for sublist in merged_with_current:
            for subarray in arr[:]:
                if any(x in subarray for x in sublist):
                    found = True
                    merged_with_current.append(subarray)
                    arr.remove(subarray)

        if found == False:
            break

        merged_list = [item for sublist in merged_with_current for item in sublist]
        new_merged_list = []
        for elem in merged_list:
            if elem not in new_merged_list:
                new_merged_list.append(elem)
        merged_list = new_merged_list
        merged = merged_list

    return merged

def get_class_matches(matches,labels_list):

    class_matches = []

    for match in matches:
        class_match = []
        for entry in match:
            class_match.append(labels_list[entry[0]][entry[1]])
        class_matches.append(class_match)

    return class_matches


def iou(box1, box2):
    """
    Calculate the intersection-over-union (IoU) of two bounding boxes.

    Args:
        box1 (list): A list of 4 elements (x1, y1, x2, y2) representing the coordinates of the first box.
        box2 (list): A list of 4 elements (x1, y1, x2, y2) representing the coordinates of the second box.

    Returns:
        float: The IoU value of the two bounding boxes.
    """
    # Calculate the coordinates of the intersection rectangle
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    # If the intersection is negative (the boxes don't overlap), return 0
    if x2 < x1 or y2 < y1:
        return 0.0

    # Calculate the area of the intersection rectangle
    intersection_area = (x2 - x1) * (y2 - y1)

    # Calculate the area of both bounding boxes
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])

    # Calculate the union area as the sum of the areas of the two bounding boxes minus the intersection area
    union_area = box1_area + box2_area - intersection_area

    # Calculate the IoU as the intersection over the union
    iou = intersection_area / union_area

    return iou


def get_roi_matches(iou_matrices):

    max_values = []
    matches = []
    min_match = []
    for entry in iou_matrices:
        max_values_entry = []
        column_labels = entry.columns.tolist()
        row_labels = entry.index.tolist()

        # extract the numbers from the labels using string manipulation
        column_labels = [[int(x) for x in label.split() if x.isdigit()] for label in column_labels]
        row_labels = [[int(x) for x in label.split() if x.isdigit()] for label in row_labels]
        # get min match
        min_value = 10
        min_index = 0

        for index, row in entry.iterrows():
            index_label = entry.index.get_loc(index)
            index_max = entry.columns.get_loc(row.idxmax())
            max_values_entry.append(row.max())
            if row.max() < min_value:
                min_value = row.max()
                min_index = [index_label,index_max]
            matches.append([row_labels[index_label],column_labels[index_max]])
        min_match.append([row_labels[min_index[0]],column_labels[min_index[1]]])
        max_values.append(max_values_entry)

    return max_values, matches, min_match

async def validate_model_yolo(model_path, yaml_path = "labels.yaml", image_size = 640):
    project_path = os.path.dirname(os.path.dirname(model_path))

    def run_validation():
        subprocess.run(
            ["python", "yolov5/val.py", "--img", str(image_size), "--data", yaml_path, "--weights", model_path, "--device", "0", "--exist-ok" ,"--project", project_path, "--name", "validationResults"],
            check=True
        )

    # Run the blocking function in a separate thread using the thread pool executor
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        await loop.run_in_executor(executor, run_validation)

    return project_path + "/validationResults"


async def train_model(model_path,image_size, epoch_len, batch_size, yaml_path, models_id):
    model_path_new = model_path.split("/")
    model_name = model_path[3]
    model_name_new = model_name.split("_")
    model_name = model_name_new[0]
    weights_path = model_path
    random_int = random.randint(10000000, 99999999)
    new_model_name = "best.pt" + "_" + str(random_int)
    # Define the blocking function to be executed in a separate thread
    def run_training():
        subprocess.run(
            ["python", "yolov5/train.py", "--img", str(image_size), "--batch", str(batch_size),
            "--epochs", str(epoch_len), "--data", yaml_path, "--weights", weights_path,
            "--project", "storage/Models/", "--name", new_model_name, "--device", "0"],
            check=True
        )

    # Run the blocking function in a separate thread using the thread pool executor
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        await loop.run_in_executor(executor, run_training)

    return new_model_name

def load_model(path):
    return torch.hub.load('ultralytics/yolov5', 'custom', path=path)


async def render_images(model_path, image_paths, save_path):
    from yolov5.detect import run2
    model = await asyncio.to_thread(load_model, model_path)

    annotated_image_paths = []
    for image_path in image_paths:
        results = await asyncio.to_thread(model,image_path)# Perform inference on the image
        results.save(save_dir="frontend//public//Annotated_Images")  # Render the predicted bounding boxes on the image

        # Save the rendered image to the specified path
        save_image_path = "/Annotated_Images" + '/' + image_path.split('/')[-1]
        annotated_image_paths.append(save_image_path)


    return annotated_image_paths

async def render_images_yolov7(model_path, image_paths, save_path):
    #model = await asyncio.to_thread(load_yolov7_model, model_path)
    from yolov7.run import run
    annotated_image_paths = []
    for image_path in image_paths:
        results = await asyncio.to_thread(run,source=image_path, weights = model_path)# Perform inference on the image
        #results.save(save_dir="frontend//public//Annotated_Images")  # Render the predicted bounding boxes on the image

        # Save the rendered image to the specified path
        save_image_path = "Visual_Annotation_Tool_Images/Images" + '/' + image_path.split('/')[-1]
        annotated_image_paths.append(save_image_path)


    return annotated_image_paths



