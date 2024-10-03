import openai
import base64
import requests



"""
def get_answer(prompt, base64_images=None):
    messages = [
        {"role": "system", "content": "You are a helpful assistant explaining the results of object detection for fire safety equipment."},
        {"role": "user", "content": prompt}
    ]
    
    if base64_images:
        for i, img in enumerate(base64_images):
            messages.append({"role": "user", "content": f"Image {i+1} in base64 format: {img}"})
    
    response = openai.ChatCompletion.create(
        model="gpt-4", 
        messages=messages,
        max_tokens=150,  
        n=1,
        stop=None,
        temperature=0.7,  
    )
    return response.choices[0].message['content'].strip()
"""
def get_answer(prompt, api_key):
    openai.api_key = api_key
    if prompt.context and prompt.context.image:
        context_image = prompt.context.image
    else:
        context_image = ""
    headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt.text},
                    {"type": "text", "text": "You are a helpful assistant explaining what could potentially be a fire hazard in the image."},
                    {"type": "text", "text": "Here is the image:"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{context_image}"}},
                ]
            }
        ],
        "max_tokens": 300
    }
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    answer = response.json()["choices"][0]["message"]["content"]
    return answer

def get_answer_no_image(prompt, api_key):
    openai.api_key = api_key
    headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt.text},
                    {"type": "text", "text": "You are a helpful assistant regarding Fire Inspection tools."}
                ]
            }
        ],
        "max_tokens": 300
    }
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    answer = response.json()["choices"][0]["message"]["content"]
    return answer
"""
# Example usage
user_input = "Explain the concept of object detection"
# Example base64 image 
base64_image = base64.b64encode(open("example_image.png", "rb").read()).decode('utf-8')
reply = get_answer(user_input, base64_images=[base64_image])
print(reply)
"""