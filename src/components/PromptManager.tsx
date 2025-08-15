
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Save,
  Download,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle,
  History,
  RefreshCw,
  Eye,
} from "lucide-react";

interface PromptData {
  content: string;
  type: string;
  updated_by?: string;
  updated_at?: string;
  source?: string;
}

interface PromptHistory {
  content: string;
  updated_by: string;
  updated_at: string;
  type: string;
}

const PromptManager = () => {
  const { currentUser } = useAuth();
  const [prompts, setPrompts] = useState<{[key: string]: PromptData}>({});
  const [selectedPromptType, setSelectedPromptType] = useState("assessment");
  const [promptContent, setPromptContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const API_BASE = "https://degree-works-backend-hydrabeans.replit.app";

  const promptTypes = [
    { value: "assessment", label: "Assessment", description: "College transfer assessment analysis" },
    { value: "presentation", label: "Presentation", description: "AI-powered presentation generation" },
    { value: "firecrawl", label: "Firecrawl", description: "Web content analysis and extraction" },
  ];

  const getAuthToken = async () => {
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  };

  const fetchAllPrompts = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/prompt/all`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }
      
      const data = await response.json();
      setPrompts(data.prompts || {});
      
      // Set current prompt content
      const currentPrompt = data.prompts[selectedPromptType];
      if (currentPrompt) {
        setPromptContent(currentPrompt.content || "");
        setOriginalContent(currentPrompt.content || "");
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setMessage({ type: "error", text: "Failed to load prompt content" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSinglePrompt = async (promptType: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/prompt/?prompt_type=${promptType}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${promptType} prompt`);
      }
      
      const data = await response.json();
      setPromptContent(data.content || "");
      setOriginalContent(data.content || "");
      
      // Update prompts state
      setPrompts(prev => ({
        ...prev,
        [promptType]: data
      }));
    } catch (error) {
      console.error("Error fetching prompt:", error);
      setMessage({ type: "error", text: `Failed to load ${promptType} prompt content` });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (promptType: string) => {
    if (!currentUser) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    setLoadingHistory(true);
    setMessage(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/api/prompt/history?prompt_type=${promptType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to fetch prompt history");
      }
      
      const data = await response.json();
      setHistory(data.history || []);
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching history:", error);
      setMessage({ type: "error", text: "Failed to load prompt history" });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchAllPrompts();
  }, []);

  useEffect(() => {
    const currentPrompt = prompts[selectedPromptType];
    if (currentPrompt) {
      setPromptContent(currentPrompt.content || "");
      setOriginalContent(currentPrompt.content || "");
    } else {
      fetchSinglePrompt(selectedPromptType);
    }
    setShowHistory(false);
  }, [selectedPromptType]);

  const handleSave = async () => {
    if (!currentUser) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE}/api/prompt/update`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: promptContent,
          prompt_type: selectedPromptType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update prompt");
      }

      const result = await response.json();
      setOriginalContent(promptContent);
      
      // Update prompts state
      setPrompts(prev => ({
        ...prev,
        [selectedPromptType]: {
          ...prev[selectedPromptType],
          content: promptContent,
          updated_by: result.updated_by,
          updated_at: new Date().toISOString(),
        }
      }));
      
      setMessage({ 
        type: "success", 
        text: `${selectedPromptType.charAt(0).toUpperCase() + selectedPromptType.slice(1)} prompt updated successfully. Content length: ${result.content_length} characters` 
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

  const handleSaveAll = async () => {
    if (!currentUser) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await getAuthToken();
      
      const requestBody = {
        assessment_prompt: prompts.assessment?.content || "",
        presentation_prompt: prompts.presentation?.content || "",
        firecrawl_prompt: prompts.firecrawl?.content || "",
      };

      const response = await fetch(`${API_BASE}/api/prompt/update-all`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update all prompts");
      }

      const result = await response.json();
      setOriginalContent(promptContent);
      
      setMessage({ 
        type: "success", 
        text: `All prompts updated successfully. Updated: ${result.updated_prompts.join(", ")}` 
      });
      
      // Refresh all prompts
      await fetchAllPrompts();
    } catch (error) {
      console.error("Error updating all prompts:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to update all prompts" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to reset the ${selectedPromptType} prompt to default? This will overwrite any custom changes.`)) {
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
      const formData = new FormData();
      formData.append('prompt_type', selectedPromptType);
      
      const response = await fetch(`${API_BASE}/api/prompt/reset`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to reset prompt");
      }

      // Refresh the prompt content
      await fetchSinglePrompt(selectedPromptType);
      setMessage({ type: "success", text: `${selectedPromptType.charAt(0).toUpperCase() + selectedPromptType.slice(1)} prompt reset to default successfully` });
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
      
      const response = await fetch(`${API_BASE}/api/prompt/download?prompt_type=${selectedPromptType}`, {
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
      a.download = `${selectedPromptType}_prompt.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: "success", text: `${selectedPromptType.charAt(0).toUpperCase() + selectedPromptType.slice(1)} prompt file downloaded successfully` });
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
  const currentPrompt = prompts[selectedPromptType];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            API Prompt Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage system prompts used by different AI analysis engines
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

          {/* Prompt Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt Type</label>
            <Select value={selectedPromptType} onValueChange={setSelectedPromptType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {promptTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Metadata */}
          {currentPrompt && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              <Badge variant="outline">
                Type: {currentPrompt.type}
              </Badge>
              {currentPrompt.updated_by && (
                <Badge variant="outline">
                  Updated by: {currentPrompt.updated_by}
                </Badge>
              )}
              {currentPrompt.updated_at && (
                <Badge variant="outline">
                  Updated: {new Date(currentPrompt.updated_at).toLocaleString()}
                </Badge>
              )}
              {currentPrompt.source && (
                <Badge variant="outline">
                  Source: {currentPrompt.source}
                </Badge>
              )}
            </div>
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
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {characterCount} characters
                      {hasChanges && (
                        <span className="ml-2 text-orange-600">• Unsaved changes</span>
                      )}
                    </div>
                    <Button
                      onClick={() => fetchHistory(selectedPromptType)}
                      variant="outline"
                      size="sm"
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <History className="w-3 h-3 mr-1" />
                      )}
                      History
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder={`Enter the system prompt for ${selectedPromptType} analysis...`}
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
                      Save {selectedPromptType.charAt(0).toUpperCase() + selectedPromptType.slice(1)}
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSaveAll}
                  variant="outline"
                  disabled={saving || resetting}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save All
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
                      Reset
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* History Display */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                {selectedPromptType.charAt(0).toUpperCase() + selectedPromptType.slice(1)} Prompt History
              </div>
              <Button
                onClick={() => setShowHistory(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No history found</p>
                <p className="text-sm">This prompt hasn't been updated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entry.updated_by}</Badge>
                        <Badge variant="outline">{new Date(entry.updated_at).toLocaleString()}</Badge>
                      </div>
                      <Button
                        onClick={() => {
                          setPromptContent(entry.content);
                          setShowHistory(false);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Load
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded text-sm font-mono max-h-32 overflow-y-auto">
                      {entry.content.substring(0, 200)}
                      {entry.content.length > 200 && "..."}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs defaultValue="assessment" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="presentation">Presentation</TabsTrigger>
              <TabsTrigger value="firecrawl">Firecrawl</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assessment" className="text-sm text-muted-foreground space-y-2">
              <p><strong>Purpose:</strong> Guides AI analysis for college transfer assessment and school comparison reports.</p>
              <p><strong>Used by:</strong> <code>/api/compare</code> endpoint for generating transfer friendliness reports.</p>
            </TabsContent>
            
            <TabsContent value="presentation" className="text-sm text-muted-foreground space-y-2">
              <p><strong>Purpose:</strong> Processes user prompts through AI for presentation generation.</p>
              <p><strong>Used by:</strong> <code>/api/v1/ppt/generate/presentation</code> endpoint for creating structured 18-slide presentations.</p>
            </TabsContent>
            
            <TabsContent value="firecrawl" className="text-sm text-muted-foreground space-y-2">
              <p><strong>Purpose:</strong> Analyzes college websites and extracts transfer-related information.</p>
              <p><strong>Used by:</strong> Web crawling college routes for extracting relevant transfer data.</p>
            </TabsContent>
          </Tabs>
          
          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p><strong>Best Practices:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Be specific about the type of analysis required</li>
              <li>Include instructions for handling missing data</li>
              <li>Specify the desired tone and formatting</li>
              <li>Test changes thoroughly before deploying</li>
            </ul>
            <p><strong>Note:</strong> Changes to prompts will affect all future AI analyses. Existing saved results will not be affected.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptManager;
