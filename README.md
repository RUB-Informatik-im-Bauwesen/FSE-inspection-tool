# Active-Learning-Application-for-Object-Detection-on-a-Technical-Building-Equipment-Dataset

Schritt 1 (Klonen des Git Repository):

URL: Hydropic/Active-Learning-Application-for-Object-Detection-on-a-Technical-Building-Equipment-Dataset (github.com)

Schritt 2 (Erstellung der Datenbank):
  1. Setze den Port in der docker-compose.yaml zu "27017:27017"
  2. Führe den Befehl: “docker-compose up -d” im Powershell aus
  3. Downloade dir MongoDB Compass und verbinde dich mit folgender URL zu der Datenbank:       
 “mongodb://root:example@localhost:27017/” (OPTIONAL)

Schritt 3 (Virtual Environment erstellen):
  1. Führe den Command “python -m venv venv” aus
  2. Dann aktiviere die Virtual Environment mittels “venv\Scripts\Activate.ps1”
  3. Dann führe “pip install -r requirements.txt” aus

Schritt 4 (Backend starten):
  1. Starte die Backend indem folgender Kommand ausgeführt wird: “uvicorn backend.website.main:app –reload”

Schritt 5 (Frontend starten):
  1. Starte eine neue Powershell und führe den Kommand “cd frontend” aus
  2. Führe dann “npm install” aus
  3. Letztendlich führe “npm run dev” aus
