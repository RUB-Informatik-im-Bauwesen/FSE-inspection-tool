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
                    {"type": "text", "text": "You are a helpful assistant explaining what could potentially be a fire hazard in the image. You are supposed to rate the image based on the fire hazard it poses regarding the rules of ASR A2.2."},
                    {"type": "text", "text": "Notify if any of these criterias do not apply when a fire extinguisher should be available in the image:"},
                    {"type": "text", "text": "Ensure fire extinguishers are visible, easily accessible, and placed near exits, stairwells, or intersections of corridors. Distance to the nearest extinguisher should not exceed 20 meters. Mark locations with safety signs (F001 for extinguishers, F002 for hydrants), and use luminescent materials on escape routes for visibility in low light."},               
                    {"type": "text", "text": "Analyze areas with elevated fire hazards, such as locations where flammable materials (e.g., paper, chemicals, oils) are handled or stored (e.g., factories, workshops, warehouses, kitchens). Ensure compliance with fire safety measures by verifying:"},
                    {"type": "text", "text": "Fire detection and alarm systems are installed for early detection of potential fire outbreaks."},
                    {"type": "text", "text": "Fire extinguisher distribution: Confirm that an increased number of fire extinguishers are evenly distributed and positioned within 5 to 10 meters of areas with high fire risk, such as around machinery with ignition hazards, storage areas for flammable materials, and in corridors. Multiple identical extinguishers should be placed together in high-risk zones."},
                    {"type": "text", "text": "Appropriate fire extinguishing equipment for the specific fire class (e.g., CO₂ extinguishers in labs, foam extinguishers in oil storage areas). Look for signage that clearly indicates extinguisher types and their location, following standards (F001 for extinguishers, F002 for hydrants)."},
                    {"type": "text", "text": "Fixed fire suppression systems (e.g., sprinklers, foam, or gas suppression systems) are in place where manual extinguishing is dangerous or access is limited."},
                    {"type": "text", "text": "Equipment is protected from environmental damage and placed so that it can be accessed without obstruction during a fire emergency."},
                    {"type": "text", "text": "The use of luminescent materials in signage to ensure visibility in low-light conditions, particularly along escape routes."}, 
                    {"type": "text", "text": "Here is the image that has to be analyzed based on the ASR A2.2, regarding that, give a score from 0 to 100 at the end of the response:"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{context_image}"}},
                ]
            }
        ],
        "max_tokens": 500
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