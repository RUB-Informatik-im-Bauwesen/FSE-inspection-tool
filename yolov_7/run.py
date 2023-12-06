import argparse
import time
from pathlib import Path
import zipfile
import sys
import os
import json
import cv2
import torch
import torch.backends.cudnn as cudnn
from numpy import random
import re

# Set the paths based on the location of app.py
APP_ROOT = Path(__file__).resolve()
YOLOV5_ROOT = Path(__file__).resolve().parents[0].parents[0] / "yolov5"
APP_ROOT = APP_ROOT.parents[0]
if str(APP_ROOT) not in sys.path:
    sys.path.append(str(APP_ROOT))
    if str(YOLOV5_ROOT) in sys.path:
        sys.path.remove(str(YOLOV5_ROOT))   # Get the directory containing app.py
YOLOV7_ROOT = APP_ROOT
DATA_ROOT = APP_ROOT / 'data'

IMG_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
VID_FORMATS = ['mp4', 'avi', 'mov', 'mkv', 'flv']

from yolov_7.models.experimental import attempt_load

from yolov_7.utils.datasets import img_formats, vid_formats, LoadImages, LoadStreams
from yolov_7.utils.general import check_img_size, check_requirements, check_imshow, non_max_suppression, apply_classifier, \
    scale_coords, xyxy2xywh, strip_optimizer, set_logging, increment_path
from yolov_7.utils.plots import plot_one_box
from yolov_7.utils.torch_utils import select_device, load_classifier, time_synchronized, TracedModel


@torch.no_grad()
def run(
        weights=YOLOV7_ROOT / 'best.pt',  # model.pt path(s)
        source=DATA_ROOT / 'images',  # file/dir/URL/glob, 0 for webcam
        data=DATA_ROOT / 'coco128.yaml',  # dataset.yaml path
        imgsz=(640, 640),  # inference size (height, width)
        conf_thres=0.25,  # confidence threshold
        iou_thres=0.45,  # NMS IOU threshold
        max_det=1000,  # maximum detections per image
        device='',  # cuda device, i.e. 0 or 0,1,2,3 or cpu
        view_img=False,  # show results
        save_txt=False,  # save results to *.txt
        save_conf=False,  # save confidences in --save-txt labels
        save_crop=False,  # save cropped prediction boxes
        save_json=True,
        nosave=False,  # do not save images/videos
        classes=None,  # filter by class: --class 0, or --class 0 2 3
        agnostic_nms=False,  # class-agnostic NMS
        augment=False,  # augmented inference
        save_img=True,
        visualize=False,  # visualize features
        update=False,  # update all models
        project=YOLOV7_ROOT / 'runs/detect',  # save results to project/name
        name='exp1',  # save results to project/name
        exist_ok=False,  # existing project/name ok, do not increment
        line_thickness=10,  # bounding box thickness (pixels)
        hide_labels=False,  # hide labels
        hide_conf=False,  # hide confidences
        half=False,  # use FP16 half-precision inference
        dnn=False,  # use OpenCV DNN for ONNX inference
):
    save_img = not nosave and not source.endswith('.txt')  # save inference images
    webcam = source.isnumeric() or source.endswith('.txt') or source.lower().startswith(
        ('rtsp://', 'rtmp://', 'http://', 'https://'))

    # Directories
    save_dir = Path("frontend\public\Visual_Annotation_Tool_Images\Images")  # increment run
    (save_dir / 'labels' if save_txt else save_dir).mkdir(parents=True, exist_ok=True)  # make dir

    # Add this line to define the directory for saving cropped images
    save_cropped_dir = save_dir / 'cropped_images'
    save_cropped_dir.mkdir(parents=True, exist_ok=True)


    # Initialize
    set_logging()
    device = select_device(device)

    json_data_list = []


    # Load model
    model = attempt_load(weights, map_location=device)  # load FP32 model
    stride = int(model.stride.max())  # model stride

    saved_image_paths = []  # Initialize empty list for saved image paths
    saved_json_paths = []  # Initialize empty list for saved JSON paths
    saved_cropped_paths = []  # Add this line

    # Dataloader
    vid_path, vid_writer = None, None
    if webcam:
        view_img = check_imshow()
        cudnn.benchmark = True  # set True to speed up constant image size inference
        dataset = LoadStreams(source, img_size=imgsz, stride=stride)
    else:
        dataset = LoadImages(source, img_size=imgsz, stride=stride)

    # Get names and colors
    names = ['manufacturer tag', 'inspection tag']
    colors = [[random.randint(0, 255) for _ in range(3)] for _ in names]

    # Run inference
    if device.type != 'cpu':
        model(torch.zeros(1, 3, imgsz, imgsz).to(device).type_as(next(model.parameters())))  # run once
    old_img_w = old_img_h = imgsz
    old_img_b = 1

    t0 = time.time()

    class_obj_count = {}  # Dictionary to store counters for each class

    for path, img, im0s, vid_cap in dataset:
        img = torch.from_numpy(img).to(device)
        img = img.half() if half else img.float()  # uint8 to fp16/32
        img /= 255.0  # 0 - 255 to 0.0 - 1.0
        if img.ndimension() == 3:
            img = img.unsqueeze(0)



        # Warmup
        if device.type != 'cpu' and (
                old_img_b != img.shape[0] or old_img_h != img.shape[2] or old_img_w != img.shape[3]):
            old_img_b = img.shape[0]
            old_img_h = img.shape[2]
            old_img_w = img.shape[3]
            for i in range(3):
                model(img, augment=opt.augment)[0]

        # Inference
        t1 = time_synchronized()
        with torch.no_grad():  # Calculating gradients would cause a GPU memory leak
            pred = model(img, augment=augment)[0]
        t2 = time_synchronized()

        # Apply NMS
        pred = non_max_suppression(pred, conf_thres, iou_thres, classes=classes, agnostic=agnostic_nms)
        t3 = time_synchronized()

        # Apply Classifier
        classify = False
        if classify:
            pred = apply_classifier(pred, modelc, img, im0s)


        # Process detections
        for i, det in enumerate(pred):  # detections per image
            if webcam:  # batch_size >= 1
                p, s, im0, frame = path[i], '%g: ' % i, im0s[i].copy(), dataset.count
            else:
                p, s, im0, frame = path, '', im0s, getattr(dataset, 'frame', 0)

            p = Path(p)  # to Path
            save_path = str(save_dir / p.name)  # img.jpg
            txt_path = str(save_dir / 'labels' / p.stem) + ('' if dataset.mode == 'image' else f'_{frame}')  # img.txt
            gn = torch.tensor(im0.shape)[[1, 0, 1, 0]]  # normalization gain whwh
            if len(det):

                # Rescale boxes from img_size to im0 size
                det[:, :4] = scale_coords(img.shape[2:], det[:, :4], im0.shape).round()

                # Print results
                for c in det[:, -1].unique():
                    n = (det[:, -1] == c).sum()  # detections per class
                    s += f"{n} {names[int(c)]}{'s' * (n > 1)}, "  # add to string

                # Write results
                for i, (*xyxy, conf, cls) in enumerate(det):  # detections per image
                    if save_txt:  # Write to file
                        xywh = (xyxy2xywh(torch.tensor(xyxy).view(1, 4)) / gn).view(-1).tolist()  # normalized xywh
                        line = (cls, *xywh, conf) if opt.save_conf else (cls, *xywh)  # label format
                        with open(txt_path + '.txt', 'a') as f:
                            f.write(('%g ' * len(line)).rstrip() % line + '\n')

                    if save_img or view_img:  # Add bbox to image
                        c = int(cls)  # integer class
                        # Construct a unique image path for each detection
                        label = f'{names[int(cls)]} {conf:.2f}'
                        plot_one_box(xyxy, im0, label=label, color=colors[int(cls)], line_thickness=10)
                        # h umfasst die Liste der Objektklassen; Bei jeder positiven Klasse wird ein Eintrag in der JSON getätigt
                        xywh = (xyxy2xywh(torch.tensor(xyxy).view(1, 4)) / gn).view(-1).tolist()  # normalized xywh

                        data_dict = {
                            'type': names[c],  # Changed to use class name
                            'class_id': int(cls),
                            'guid': 542348234,
                            'comment': f'{names[c]} was successfully detected.',
                            'bounding_box': {
                                'x_center': xywh[0],
                                'y_center': xywh[1],
                                'width': xywh[2],
                                'height': xywh[3]
                            },
                            'input image name': p.name
                        }

                        json_data_list.append(data_dict)

                for (*xyxy, conf, cls) in det:
                    xyxy = [int(x) for x in xyxy]  # Convert to integers
                    class_name = names[int(cls)]

                    # Crop the object from the original image (im0)
                    cropped_object = im0[xyxy[1]:xyxy[3], xyxy[0]:xyxy[2]]

                    # Generate a unique filename for the cropped image using class and counter
                    if class_name not in class_obj_count:
                        class_obj_count[class_name] = 0  # Initialize the counter
                    else:
                        class_obj_count[class_name] += 1  # Increment the counter

                    # Modify this line to save cropped images directly under the output data directory
                    cropped_image_path = save_cropped_dir / f'{class_name}_{class_obj_count[class_name]}_{p.name}_results.jpg'

                    print(f"Saving cropped image to: {cropped_image_path}")  # Add this line for debugging

                    # Save the cropped object as an image
                    cv2.imwrite(str(cropped_image_path), cropped_object)

                    # Append the path of the cropped image to the list
                    saved_cropped_paths.append(str(cropped_image_path))  # Append the path of the cropped image # Append the path of the cropped image

            if view_img:
                cv2.imshow(str(p), im0)
                cv2.waitKey(1)  # 1 millisecond

            # Save results (image with detections)
            if save_img:
                if dataset.mode == 'image':
                    cv2.imwrite(save_path, im0)
                    print(f" The image with the result is saved in: {save_path}")
                else:  # 'video' or 'stream'
                    if vid_path != save_path:  # new video
                        vid_path = save_path
                        if isinstance(vid_writer, cv2.VideoWriter):
                            vid_writer.release()  # release previous video writer
                        if vid_cap:  # video
                            fps = vid_cap.get(cv2.CAP_PROP_FPS)
                            w = int(vid_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                            h = int(vid_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                        else:  # stream
                            fps, w, h = 30, im0.shape[1], im0.shape[0]
                            save_path += '.mp4'
                        vid_writer = cv2.VideoWriter(save_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))
                    vid_writer.write(im0)

            saved_image_paths.append(save_path)  # Append saved image path

            # Save results as JSON
            if save_json and json_data_list:
                json_file_path = str(save_dir / f'{p.stem}.json')
                with open(json_file_path, 'w') as json_file:
                    json.dump({'info': {'description': 'Result of Service-206', 'version': '0.0.2'},
                               'result': {'types': list(set([data['type'] for data in json_data_list])),
                                          'objects': json_data_list}},
                              json_file, indent=4)
                saved_json_paths.append(json_file_path)

    return saved_image_paths, saved_json_paths, saved_cropped_paths



if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', nargs='+', type=str, default='yolov7.pt', help='model.pt path(s)')
    parser.add_argument('--source', type=str, default='inference/images', help='source')  # file/folder, 0 for webcam
    parser.add_argument('--img-size', type=int, default=640, help='inference size (pixels)')
    parser.add_argument('--conf-thres', type=float, default=0.25, help='object confidence threshold')
    parser.add_argument('--iou-thres', type=float, default=0.45, help='IOU threshold for NMS')
    parser.add_argument('--device', default='', help='cuda device, i.e. 0 or 0,1,2,3 or cpu')
    parser.add_argument('--view-img', action='store_true', help='display results')
    parser.add_argument('--save-txt', action='store_true', help='save results to *.txt')
    parser.add_argument('--save-conf', action='store_true', help='save confidences in --save-txt labels')
    parser.add_argument('--nosave', action='store_true', help='do not save images/videos')
    parser.add_argument('--classes', nargs='+', type=int, help='filter by class: --class 0, or --class 0 2 3')
    parser.add_argument('--agnostic-nms', action='store_true', help='class-agnostic NMS')
    parser.add_argument('--augment', action='store_true', help='augmented inference')
    parser.add_argument('--update', action='store_true', help='update all models')
    parser.add_argument('--project', default='runs/detect', help='save results to project/name')
    parser.add_argument('--name', default='exp', help='save results to project/name')
    parser.add_argument('--exist-ok', action='store_true', help='existing project/name ok, do not increment')
    parser.add_argument('--line-thickness', default=3, type=int, help='bounding box thickness (pixels)')
    parser.add_argument('--hide-labels', default=False, action='store_true', help='hide labels')
    parser.add_argument('--hide-conf', default=False, action='store_true', help='hide confidences')
    parser.add_argument('--half', action='store_true', help='use FP16 half-precision inference')
    parser.add_argument('--dnn', action='store_true', help='use OpenCV DNN for ONNX inference')

    opt = parser.parse_args()
    print(opt)
    #check_requirements(exclude=('pycocotools', 'thop'))


    with torch.no_grad():
        if opt.update:  # update all models (to fix SourceChangeWarning)
            for opt.weights in ['yolov7.pt']:
                run()
                strip_optimizer(opt.weights)
        else:
            run()