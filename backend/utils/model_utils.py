import os
import subprocess
import pandas as pd
import shutil
import base64
from datetime import datetime
import numpy as np
import random
import asyncio
from concurrent.futures import ThreadPoolExecutor
from backend.website.db import collection_jsons, collection_result_images
import torch
import cv2
import importlib
import json
import random
import string
from ultralytics import YOLO

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
            ["python", "yolov_5/val.py", "--img", str(image_size), "--data", yaml_path, "--weights", model_path, "--device", "0", "--exist-ok" ,"--project", project_path, "--name", "validationResults"],
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
            ["python", "yolov_5/train.py", "--img", str(image_size), "--batch", str(batch_size),
            "--epochs", str(epoch_len), "--data", yaml_path.replace("\\","/"), "--weights", weights_path,
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
    model = await asyncio.to_thread(load_model, model_path)

    annotated_image_paths = []
    for image_path in image_paths:
        results = await asyncio.to_thread(model,image_path)# Perform inference on the image
        results.save(save_dir="frontend//public//Annotated_Images")  # Render the predicted bounding boxes on the image

        # Save the rendered image to the specified path
        save_image_path = "/Annotated_Images" + '/' + image_path.split('/')[-1]
        annotated_image_paths.append(save_image_path)


    return annotated_image_paths

async def render_images_annotation_tool(model_path, image_paths, save_path):

    module = importlib.import_module("yolov_5.run_Brandschutz")

    annotated_image_paths = []
    for image_path in image_paths:
        await asyncio.to_thread(module.run,source=image_path, weights = model_path) # Perform inference on the image

        # Save the rendered image to the specified path
        save_image_path = "Visual_Annotation_Tool_Images/Images" + '/' + image_path.split('/')[-1]
        annotated_image_paths.append(save_image_path)


    return annotated_image_paths
"""
async def render_images_yolov7(model_path, image_paths, model_type):
    #model = await asyncio.to_thread(load_yolov7_model, model_path)

    import_dict = {
    "Wartungsinformationen": "yolov_7.run_wartung",
    "Prüfplakettenaufkleber": "yolov_7.run",
    "Sicherheitsschilder": "yolov_7.run_sicherheit",
    }

    import_statement = import_dict.get(model_type, "Invalid model_type")

    module = importlib.import_module(import_statement)

    annotated_image_paths = []
    for image_path in image_paths:
        results = await asyncio.to_thread(module.run,source=image_path, weights = model_path,device="gpu")# Perform inference on the image
        #results.save(save_dir="frontend//public//Annotated_Images")  # Render the predicted bounding boxes on the image

        # Save the rendered image to the specified path
        save_image_path = "Visual_Annotation_Tool_Images/Images" + '/' + image_path.split('/')[-1]
        annotated_image_paths.append(save_image_path)


    return annotated_image_paths
"""

# Function to decode base64 image to numpy array
def decode_base64_image(base64_string):
    # Decode base64 string to bytes
    image_data = base64.b64decode(base64_string)
    # Convert bytes to numpy array
    np_arr = np.frombuffer(image_data, np.uint8)
    # Decode numpy array to image
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

# Function to encode numpy array to base64 image
def encode_image_to_base64(image):
    _, buffer = cv2.imencode('.jpg', image)
    base64_image = base64.b64encode(buffer).decode('utf-8')
    return base64_image

async def render_images_yolov8(model_path, base64_image, model_type, user):
    #model = await asyncio.to_thread(load_yolov7_model, model_path)
    print("render_image")
    model = YOLO(model_path)
    np_image = decode_base64_image(base64_image)
    results = model(np_image)
    if model_type == 'Blockiertheit_modal' or model_type == 'Blockiertheit_amodal':
        # Process segmentation results
        masks = results[0].masks  # Assuming results[0].masks contains the segmentation masks
        print("masks", masks)
        annotated_image = results[0].plot()  # This returns a numpy array with the annotations
        # Encode the annotated image back to base64
        annotated_base64_image = encode_image_to_base64(annotated_image)
        
        # Save the annotated image and masks
        characters = string.ascii_letters + string.digits
        name = ''.join(random.choice(characters) for _ in range(10))
        collection_result_images.insert_one({"filename": name, "base64": annotated_base64_image })
        
        data_dict = []
        class_names = results[0].names  # Extract class names from results
        for mask, cls in zip(masks.data, results[0].boxes.cls):
            class_name = class_names[int(cls)]  # Get class name using index
            data_dict.append({
                'type': class_name,
                'guid': 542348234,
                'comment': f'{class_name}',
                'segmentation_mask': mask.tolist()  # Convert mask data to list
            })
    else:
        # Process bounding box results
        annotated_image = results[0].plot()  # This returns a numpy array with the annotations
        # Encode the annotated image back to base64
        annotated_base64_image = encode_image_to_base64(annotated_image)
        
        # Save the annotated image and bounding boxes
        characters = string.ascii_letters + string.digits
        name = ''.join(random.choice(characters) for _ in range(10))
        collection_result_images.insert_one({"filename": name, "base64": annotated_base64_image })
        
        data_dict = []
        class_names = results[0].names  # Extract class names from results
        for box in results[0].boxes:
            xywh = box.xywh.tolist()  # Convert tensor to list
            cls = int(box.cls)  # Extract class index
            class_name = class_names[cls]  # Get class name using index
            data_dict.append({
                'type': class_name,
                'guid': 542348234,
                'comment': f'{class_name}',
                'bounding_box': {
                    'x_center': xywh[0][0],
                    'y_center': xywh[0][1],
                    'width': xywh[0][2],
                    'height': xywh[0][3]
                }
            })
    formatted_date = datetime.now().strftime("%d.%m.%Y")
    formatted_timestamp = datetime.now().strftime("%H:%M:%S")
    document = {
        "name": name,
        "user": user["username"],
        "data_json": data_dict,
        "encoded_image": annotated_base64_image,
        "date": formatted_date,
        "timestamp": formatted_timestamp
    }
    await collection_jsons.insert_one(document)
    """
    # Save the data dictionary as a JSON file
    json_save_path = f"frontend//public//Annotated_Images//{name}.json"
    os.makedirs(os.path.dirname(json_save_path), exist_ok=True)
    with open(json_save_path, 'w') as json_file:
        json.dump(data_dict, json_file, indent=4)
    """
    preproTime = 0
    inferenceTime = 0
    postproTime = 0
    for r in results:
        preproTime = preproTime + r.speed['preprocess']
        inferenceTime = inferenceTime + r.speed['inference']
        postproTime = postproTime + r.speed['postprocess']
    return annotated_base64_image, name, [preproTime, inferenceTime, postproTime]

async def render_blockedarea_yolov8(model_path, base64_image, model_type, user):
    #model = await asyncio.to_thread(load_yolov7_model, model_path)
    print("render_image")
    results = [None] * len(model_path)
    masks = []
    for i, mp in enumerate(model_path):
        model = YOLO(mp)
        print("model: ", model)
        np_image = decode_base64_image(base64_image)
        results[i] = model(np_image)
        masks.append(results[i][0].masks.data.cpu().numpy())  # Assuming masks are stored in results[i].masks.data

    if model_type == 'FSE_Condition_Check':
        # Resize masks to match the original image size
        original_height, original_width, _ = np_image.shape
        binary_masks = []

        for mask in masks:
            # Assuming each mask can contain multiple segmentation channels, combine them into one binary mask
            combined_mask = np.zeros((original_height, original_width), dtype=np.uint8)
            for channel in mask:
                resized_channel = cv2.resize(channel, (original_width, original_height), interpolation=cv2.INTER_NEAREST)
                combined_mask = np.maximum(combined_mask, (resized_channel > 0).astype(np.uint8))
            binary_masks.append(combined_mask)

        # Binary masks for the two segmentations
        binary_mask1 = binary_masks[0]  # First segmentation
        binary_mask2 = binary_masks[1]  # Second segmentation
        
        # Compute the non-overlapping part of the second segmentation
        non_overlapping_mask = cv2.bitwise_and(binary_mask2, cv2.bitwise_not(binary_mask1))

        # Calculate the area of the non-overlapping region
        non_overlapping_area = np.sum(non_overlapping_mask)

        # Calculate the total area of the second segmentation
        total_area_mask2 = np.sum(binary_mask2)
        # Percentage of the non-overlapping area in relation to the second segmentation
        remaining_percentage = (non_overlapping_area / total_area_mask2) * 100 if total_area_mask2 > 0 else 0
        print(f"Remaining area percentage: {remaining_percentage:.2f}%")

        # Find the bounding box of the non-overlapping region
        non_zero_coords = cv2.findNonZero(non_overlapping_mask)
        if non_zero_coords is not None:
            x, y, w, h = cv2.boundingRect(non_zero_coords)

            # Annotate the image with the bounding box
            annotated_image = np_image.copy()
            annotated_image[non_overlapping_mask > 0] = [0, 255, 0]  # Highlight non-overlapping area in green
            cv2.rectangle(annotated_image, (x, y), (x + w, y + h), (255, 0, 0), 2)  # Blue bounding box
        else:
            print("No non-overlapping area found.")
            annotated_image = np_image.copy()
        # Dynamic font size and thickness based on image size
        font_scale = original_height / 500  # Adjust divisor as needed to scale text
        font_thickness = max(1, int(original_height / 500))  # Ensure a minimum thickness

        # Add the percentage text to the bottom-left corner of the image
        label = f"{remaining_percentage:.2f}%"
        text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)[0]
        text_x, text_y = 10, original_height - 10  # Bottom-left corner
        text_width, text_height = text_size[0], text_size[1]

        # Draw a white rectangle for the background
        cv2.rectangle(
            annotated_image,
            (text_x - 5, text_y - text_height - 5),  # Top-left corner of the background
            (text_x + text_width + 5, text_y + 5),  # Bottom-right corner of the background
            (255, 255, 255),  # White color
            -1,  # Filled rectangle
        )

        # Overlay the black text on top of the white background
        cv2.putText(
            annotated_image,
            label,
            (text_x, text_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,  # Dynamic font scale
            (0, 0, 0),  # Black text
            font_thickness,  # Dynamic thickness
            cv2.LINE_AA,
        )

        # Encode the annotated image back to base64
        annotated_base64_image = encode_image_to_base64(annotated_image)
        # Save the annotated image and masks
        characters = string.ascii_letters + string.digits
        name = ''.join(random.choice(characters) for _ in range(10))
        collection_result_images.insert_one({"filename": name, "base64": annotated_base64_image })
        
        data_dict = []
        class_names = results[1][0].names  # Extract class names from results
        for mask, cls in zip(non_overlapping_mask, results[1][0].boxes.cls):
            class_name = class_names[int(cls)]  # Get class name using index
            data_dict.append({
                'type': class_name,
                'guid': 542348234,
                'comment': f'{class_name}',
                'segmentation_mask': mask.tolist()  # Convert mask data to list
            })
    formatted_date = datetime.now().strftime("%d.%m.%Y")
    formatted_timestamp = datetime.now().strftime("%H:%M:%S")
    document = {
        "name": name,
        "user": user["username"],
        "data_json": data_dict,
        "encoded_image": annotated_base64_image,
        "date": formatted_date,
        "timestamp": formatted_timestamp
    }
    await collection_jsons.insert_one(document)
    """
    # Save the data dictionary as a JSON file
    json_save_path = f"frontend//public//Annotated_Images//{name}.json"
    os.makedirs(os.path.dirname(json_save_path), exist_ok=True)
    with open(json_save_path, 'w') as json_file:
        json.dump(data_dict, json_file, indent=4)
    """
    preproTime = 0
    inferenceTime = 0
    postproTime = 0
    for model in results:
        for r in model:
            preproTime = preproTime + r.speed['preprocess']
            inferenceTime = inferenceTime + r.speed['inference']
            postproTime = postproTime + r.speed['postprocess']
    return annotated_base64_image, name, [preproTime, inferenceTime, postproTime]





