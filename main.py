from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from nutrition_data import nutrition_data
from difflib import get_close_matches

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates folder
templates = Jinja2Templates(directory="templates")

# Auto-correct function
def correct_food_name(user_input):
    user_input = user_input.lower()
    all_foods = nutrition_data.keys()
    match = get_close_matches(user_input, all_foods, n=1, cutoff=0.6)
    if match:
        return match[0]  # closest match
    return user_input

# Home page
@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Analyze meal
@app.post("/analyze")
async def analyze(meal: dict):
    meal_text = meal["meal"].lower()
    meal_items = [correct_food_name(item.strip()) for item in meal_text.split(',')]

    total_nutrition = {
        "calories": 0, "protein": 0, "carbs": 0, "fat": 0,
        "fiber": 0, "sugar": 0, "vitamin_c": 0, "iron": 0
    }
    missing_items = []

    for item in meal_items:
        if item in nutrition_data:
            for nutrient, value in nutrition_data[item].items():
                total_nutrition[nutrient] += value
        else:
            missing_items.append(item)

    # Simple suggestions
    suggestions = []
    if total_nutrition["protein"] < 20:
        suggestions.append("Add protein-rich foods like dal, paneer, or chicken.")
    if total_nutrition["fiber"] < 10:
        suggestions.append("Include fiber-rich veggies or fruits.")
    if total_nutrition["vitamin_c"] < 15:
        suggestions.append("Add vitamin C sources like guava, orange, or capsicum.")

    return JSONResponse({"nutrition": total_nutrition, "missing": missing_items, "suggestions": suggestions})
