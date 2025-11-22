# 🧪 QA Automation for Ingredient Validation

This project automates **quality assurance checks** for ingredient data across multilingual Brand websites.  
It ensures ingredient lists are complete, correctly localized, and consistent across markets.

---

## 🔍 What It Does

- Fetches ingredient data from a **Google Drive Excel library**  using SheetJS library 
- Compares website content with the reference list to detect:
  - Missing or mismatched ingredients  
  - Localization or spelling inconsistencies  
  - Formatting or display errors  
- Displays results directly in the browser for quick review

---

## ⚙️ How It Works

1. The script reads the ingredient reference file stored in Google Drive  
2. It scans the live or staging website content  
3. Discrepancies are reported in a visual panel for quick review and correction

---

## 📁 Project Structure

| File | Description |
|------|--------------|
| `qa-ingredient-check.js` | Main automation script |
| `ingredients.xlsx` | Reference ingredient library (one tab per locale) |
| `README.md` | Project overview and usage instructions |

---

## 🚀 Usage

1. Open the target webpage  
2. Run the bookmarklet or paste the script into the browser console  
3. Review the flagged discrepancies displayed on-screen  

---

## 🧰 Technologies

- JavaScript (browser-based)  with SheetJS 
- Excel / Google drive integration  
- DOM parsing for validation

 ## Test it out:
[Ingredients QA Script](/documentation.html)
  

---

## 📄 License

This project is for internal QA automation and not intended for public distribution.
