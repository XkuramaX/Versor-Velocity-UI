# Versor - No-Code Data Engineering Platform

A modern, visual data pipeline builder powered by React Flow and FastAPI/Polars backend.

## Features

### 🎨 Visual Workflow Builder
- Drag-and-drop node-based interface
- Real-time connection validation
- Professional dark theme with glassmorphism effects
- Responsive design optimized for large datasets (up to 1M rows)

### 🔧 Data Operations
- **Data Ingestion**: CSV and Excel file uploads with sheet selection
- **Transformations**: Filter, select, sort, rename, drop columns
- **String Operations**: Case conversion, slicing, concatenation
- **Math Operations**: Horizontal calculations, custom expressions
- **Advanced Analytics**: Group by, pivot tables, statistics
- **Machine Learning**: Linear regression, logistic prediction
- **Data Cleaning**: Drop nulls/duplicates, fill missing values

### 👥 Collaboration & Permissions
- **Owner**: Full access and sharing rights
- **Editor**: Can modify workflow structure
- **Runner**: Can execute workflows
- **Viewer**: Can view workflows and results

### 🚀 Execution Engine
- Smart execution with topological sorting
- Real-time status indicators (idle, running, success, error, stale)
- Automatic downstream invalidation
- Node-level caching with TTL

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ with FastAPI backend running on `http://localhost:8000`

### Installation

1. **Clone and install dependencies:**
```bash
cd UI
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:5173`

### First Login
- Username: any value
- Password: any value
- Authentication is mocked for development

## Usage Guide

### Creating Your First Workflow

1. **Login** with any credentials
2. **Create New Workflow** from the dashboard
3. **Drag nodes** from the left sidebar to the canvas
4. **Connect nodes** by dragging from output to input handles
5. **Configure nodes** using the right properties panel
6. **Upload data** for ingestion nodes (CSV/Excel)
7. **Run individual nodes** or the entire workflow

### Node Types

#### Data Ingestion
- **Upload CSV**: Import CSV files
- **Upload Excel**: Import Excel files with sheet selection

#### Data Transformation
- **Filter Data**: Apply Polars expressions (`pl.col('salary') > 50000`)
- **Select Columns**: Choose specific columns to keep
- **Drop Columns**: Remove unwanted columns
- **Sort Data**: Sort by one or more columns
- **Rename Columns**: Change column names

#### String Operations
- **Change Case**: Convert to upper, lower, or title case
- **String Slice**: Extract left/right characters
- **Concatenate**: Combine multiple columns

#### Math Operations
- **Horizontal Math**: Sum or average across columns
- **Custom Expression**: Apply mathematical operations

#### Advanced Analytics
- **Group By**: Aggregate data with multiple functions
- **Statistics**: Calculate descriptive statistics
- **Pivot Table**: Create pivot tables

#### Machine Learning
- **Linear Regression**: Train regression models
- **Logistic Prediction**: Apply logistic predictions

#### Data Cleaning
- **Drop Null Values**: Remove rows with missing data
- **Drop Duplicates**: Remove duplicate rows
- **Fill Missing**: Replace missing values

### Workflow Management

#### Saving & Loading
- **Save**: Stores workflow in browser localStorage
- **Export**: Download workflow as JSON
- **Import**: Upload workflow JSON file

#### Data Export
- **CSV**: Export node data as CSV
- **Excel**: Export node data as Excel
- **Parquet**: Export node data as Parquet

#### Sharing & Permissions
- **Share Button**: Manage user access
- **Permission Levels**: Owner, Editor, Runner, Viewer
- **Access Control**: Role-based feature restrictions

## API Integration

The frontend integrates with the FastAPI backend using these key endpoints:

### Data Ingestion
```javascript
POST /nodes/io/upload_csv
POST /nodes/io/upload_excel?sheet_name=Sheet1
POST /nodes/io/excel_sheets
```

### Transformations
```javascript
POST /nodes/transform/filter?parent_id={id}
POST /nodes/transform/select?parent_id={id}
POST /nodes/transform/sort?parent_id={id}
// ... and more
```

### Node Management
```javascript
GET /nodes/{node_id}?limit=50
GET /nodes/{node_id}/download?format=csv
POST /nodes/{node_id}/cache?ttl=3600
```

### Workflow Validation
```javascript
POST /workflow/validate-connection?parent_id={id}
GET /workflow/export
GET /health
```

## Architecture

### Frontend Stack
- **React 18** with Vite for fast development
- **React Flow** for the visual node editor
- **Tailwind CSS** for styling with custom dark theme
- **Lucide React** for consistent iconography
- **Axios** for API communication

### Key Components
- `WorkflowCanvas`: Main visual editor
- `CustomNodes`: Node rendering with status indicators
- `NodeLibrary`: Draggable node palette
- `PropertiesPanel`: Dynamic configuration forms
- `DataPreviewModal`: Data inspection with pagination
- `FileUploadModal`: File upload with drag-and-drop

### State Management
- React Context for global workflow state
- Local state for component-specific data
- localStorage for workflow persistence

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── services/           # API integration
└── styles/             # CSS and Tailwind config
```

### Key Files
- `App.jsx`: Main application with routing
- `WorkflowCanvas.jsx`: Core visual editor
- `api.js`: Backend API integration
- `useWorkflowRunner.js`: Execution engine
- `index.css`: Custom styles and theme

### Styling System
- **Dark Theme**: Professional slate color palette
- **Glassmorphism**: Backdrop blur effects
- **Node Categories**: Color-coded by operation type
- **Status Indicators**: Visual feedback for execution state
- **Responsive Design**: Mobile-friendly layouts

## Troubleshooting

### Common Issues

**Connection Validation Fails**
- Ensure parent node has been executed successfully
- Check that node configuration is complete
- Verify backend API is running on port 8000

**File Upload Errors**
- Check file format (CSV, XLSX, XLS only)
- Ensure file size is reasonable (<100MB recommended)
- Verify backend has write permissions

**Node Execution Fails**
- Check node configuration for required fields
- Ensure parent nodes have valid data
- Review error messages in node status

### Performance Tips
- Use node caching for expensive operations
- Limit data preview to reasonable row counts
- Cache frequently accessed workflows locally

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using React, React Flow, and Tailwind CSS**