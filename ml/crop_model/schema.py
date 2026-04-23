"""
Dataset schema for the Crop Recommendation model.

Each row describes one soil+weather sample labelled with the best crop.

Feature columns (all numeric):
  - N           Nitrogen in soil    (cg/kg or kg/ha, 0-250)
  - P           Phosphorus in soil  (mg/kg or kg/ha, 5-145)
  - K           Potassium in soil   (mg/kg or kg/ha, 5-205)
  - ph          Soil pH             (3.5-10.0)
  - temperature Mean temp C         (5-48)
  - humidity    Relative humidity % (14-100)
  - rainfall    Mean rainfall mm    (10-350)

Target column:
  - label       Crop name (string)

Supported crops (50 major Indian crops):
  Rice, Wheat, Maize, Cotton, Sugarcane, Soybean, Groundnut, Chickpea,
  Lentil, Mango, Mustard, Barley, Bajra, Jowar, Ragi, Sunflower, Sesame,
  Jute, Tea, Coffee, Coconut, Banana, Papaya, Guava, Pomegranate, Grape,
  Orange, Watermelon, Tomato, Onion, Potato, Brinjal, Cabbage, Cauliflower,
  Peas, Okra, Chilli, Ginger, Turmeric, Garlic, Coriander, Cumin,
  Tobacco, Rubber, Arecanut, Cashew, BlackPepper, Cardamom, Clove, Jackfruit

Data source: Synthetic based on ICAR / FAO agro-climatic ranges.
Train from repo root:
  python ml/scripts/train.py
"""

FEATURE_COLUMNS = ["N", "P", "K", "ph", "temperature", "humidity", "rainfall"]
TARGET_COLUMN = "label"
