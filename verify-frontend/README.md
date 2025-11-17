# Verify Frontend

Chrome extension frontend for the Verify fact-checking tool, built with React and Vite.

## Setup

1. Install dependencies:
```bash
npm install
```

## Dependencies

### Production Dependencies
- **react** & **react-dom**: React framework
- **lucide-react**: Icon library
- **jspdf**: PDF generation library for exporting analysis reports (required for PDF export feature)

### Development Dependencies
- **vite**: Build tool
- **@vitejs/plugin-react-swc**: React plugin for Vite with SWC
- **tailwindcss**: CSS framework
- **eslint**: Linting

## Development

Run the development server:
```bash
npm run dev
```

## Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be loaded as a Chrome extension.

## Features

- Real-time analysis of web articles
- Dynamic claim verification with streaming updates
- PDF export functionality (requires jsPDF)
- Full analysis view in sidebar
- Page highlighting of verified claims

## Notes

- **jsPDF** is required for the PDF export feature. It's included in the dependencies and will be installed automatically with `npm install`.
- The extension requires a running backend server (see backend README for setup).
