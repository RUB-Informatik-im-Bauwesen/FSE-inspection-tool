import os
import subprocess
import pandas as pd
import shutil
import numpy as np

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


def train_model(image_size, epoch_len, batch_size, yaml_path, models_id):
    old_path = "storage/Models/"+str(models_id)
    new_path = "storage/Models/Deleted"
    #os.rename(old_path,new_path)
    weights_path = old_path + "/weights/best.pt"
    subprocess.run(
        ["python", "yolov5/train.py", "--img", str(image_size), "--batch", str(batch_size), "--epochs", str(epoch_len), "--data", yaml_path,
        "--weights", weights_path, "--project", "storage/Models/", "--name", str(models_id),"--device","0"], check=True)

