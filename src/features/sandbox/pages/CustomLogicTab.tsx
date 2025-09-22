import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Code, Play, Save } from 'lucide-react'

export function CustomLogicTab() {
  const [code, setCode] = useState(`// Custom logic for your application
function processRequest(data) {
  // Add your custom processing logic here
  console.log('Processing request:', data);
  
  // Example: Transform data
  const transformed = {
    ...data,
    processedAt: new Date().toISOString(),
    processedBy: 'custom-logic'
  };
  
  return transformed;
}

// Export the function
module.exports = { processRequest };`)

  const handleRun = () => {
    // Placeholder logic
    console.log('Running custom logic:', code)
  }

  const handleSave = () => {
    // Placeholder logic
    console.log('Saving custom logic:', code)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Custom Logic Editor
          </CardTitle>
          <CardDescription>
            Write custom JavaScript functions to process your API requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button onClick={handleRun} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
                <Button onClick={handleSave} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm bg-gray-50 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your custom logic here..."
              />
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Available variables:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">data</code> - The request data</li>
                <li><code className="bg-gray-100 px-1 rounded">headers</code> - Request headers</li>
                <li><code className="bg-gray-100 px-1 rounded">params</code> - URL parameters</li>
                <li><code className="bg-gray-100 px-1 rounded">query</code> - Query parameters</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monaco Editor placeholder - commented out for now */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle>Advanced Editor</CardTitle>
          <CardDescription>
            Full-featured code editor with syntax highlighting and IntelliSense
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 border rounded-md">
            <MonacoEditor
              height="100%"
              language="javascript"
              value={code}
              onChange={setCode}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                },
              }}
            />
          </div>
        </CardContent>
      </Card>
      */}
    </div>
  )
}
