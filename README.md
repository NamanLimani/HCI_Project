# HCI_Project

## Setup

### Frontend
1. Navigate to `verify-frontend/`
2. Install dependencies: `npm install`
3. Build: `npm run build`

**Important Dependencies:**
- **jsPDF** - Required for PDF export functionality. Automatically installed with `npm install`.

### Backend
See `verify-backend/README.md` for backend setup instructions.

## TODO:
Frontend:
- Fix inline highlighting. currently doesn't save the original sentence from which the claim is extracted, just approximates. The AI needs to return the original sentence for accuracy.
- Make frontend update more incrementally rather than everything at once for smoother usability
- Fix layout and shadow issues

Backend:
- Add Google Fact Check API 
- Return links for sources found and add them to the details section
- Make AI authorship analysis more accurate. Different API maybe? Since I've found even GPTZero to be pretty inaccurate in a lot of cases, this feature might not be feasible
- ✅ Export full analysis to PDF (implemented)

Advanced features:
- Find other articles on the same topic, return titles, publishers, and urls. Add them to the end of the list of claims breakdown in a dedicated section.
- Ability to switch between different AI apis in the settings tab. Nice to have and helps us stay within free-tier limits of different services.
- Add a source reputability score for each source link 


