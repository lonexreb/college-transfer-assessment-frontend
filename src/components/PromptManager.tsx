
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Save,
  Download,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const PromptManager = () => {
  const { currentUser } = useAuth();
  const [promptContent, setPromptContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const API_BASE = "https://degree-works-backend-hydrabeans.replit.app";

  const getAuthToken = async () => {
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  };

  const fetchPrompt = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/prompt/`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch prompt");
      }
      
      const data = await response.json();
      setPromptContent(data.content || "");
      setOriginalContent(data.content || "");
    } catch (error) {
      console.error("Error fetching prompt:", error);
      setMessage({ type: "error", text: "Failed to load prompt content" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompt();
  }, []);

  const handleSave = async () => {
    if (!currentUser) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('content', promptContent);

      const response = await fetch(`${API_BASE}/api/prompt/update`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update prompt");
      }

      const result = await response.json();
      setOriginalContent(promptContent);
      setMessage({ 
        type: "success", 
        text: `Prompt updated successfully. Content length: ${result.content_length} characters` 
      });
    } catch (error) {
      console.error("Error updating prompt:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to update prompt" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the prompt to default? This will overwrite any custom changes.")) {
      return;
    }

    if (!currentUser) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    setResetting(true);
    setMessage(null);

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/prompt/reset`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to reset prompt");
      }

      // Refresh the prompt content
      await fetchPrompt();
      setMessage({ type: "success", text: "Prompt reset to default successfully" });
    } catch (error) {
      console.error("Error resetting prompt:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to reset prompt" 
      });
    } finally {
      setResetting(false);
    }
  };

  const handleDownload = async () => {
    if (!currentUser) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/prompt/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to download prompt");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'api_prompt.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: "success", text: "Prompt file downloaded successfully" });
    } catch (error) {
      console.error("Error downloading prompt:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to download prompt" 
      });
    }
  };

  const hasChanges = promptContent !== originalContent;
  const characterCount = promptContent.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            API Prompt Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage the system prompt used by the AI analysis engine
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading prompt content...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Prompt Content</label>
                  <div className="text-sm text-muted-foreground">
                    {characterCount} characters
                    {hasChanges && (
                      <span className="ml-2 text-orange-600">• Unsaved changes</span>
                    )}
                  </div>
                </div>
                <Textarea
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Enter the system prompt for AI analysis..."
                  className="min-h-[300px] font-mono text-sm"
                  disabled={saving || resetting}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges || !promptContent.trim()}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  disabled={saving || resetting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>

                <Button
                  onClick={handleReset}
                  variant="destructive"
                  disabled={saving || resetting}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset to Default
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Purpose:</strong> This prompt guides the AI analysis engine when generating 
              school comparison reports and recommendations.
            </p>
            <p>
              <strong>Best Practices:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Be specific about the type of analysis required</li>
              <li>Include instructions for handling missing data</li>
              <li>Specify the desired tone and formatting</li>
              <li>Mention transfer-specific considerations</li>
            </ul>
            <p>
              <strong>Note:</strong> Changes to the prompt will affect all future AI analyses. 
              Existing saved comparisons will not be affected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptManager;
