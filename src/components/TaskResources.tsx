import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Link as LinkIcon, Type, Plus, Trash2, ExternalLink, X, Loader2, Upload, Download } from 'lucide-react';

interface TaskResource {
  id: string;
  task_id: string;
  user_id: string;
  type: 'text' | 'link' | 'file';
  title: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface TaskResourcesProps {
  taskId: string;
}

const TYPE_ICON = {
  text: <Type className="h-3.5 w-3.5" />,
  link: <LinkIcon className="h-3.5 w-3.5" />,
  file: <FileText className="h-3.5 w-3.5" />,
};

const TYPE_LABEL = { text: 'Note', link: 'Link', file: 'File' };

const TaskResources: React.FC<TaskResourcesProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<TaskResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<'text' | 'link' | 'file'>('text');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchResources = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('task_resources')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      setResources((data as any[])?.map(r => ({ ...r, type: r.type as 'text' | 'link' | 'file' })) || []);
      setLoading(false);
    };
    fetchResources();
  }, [taskId, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newTitle.trim()) setNewTitle(file.name);
    }
  };

  const handleAdd = async () => {
    if (!user || !newTitle.trim()) return;
    if (newType === 'file' && !selectedFile) return;

    setSaving(true);

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (newType === 'file' && selectedFile) {
      const ext = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/${taskId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('task-resources')
        .upload(filePath, selectedFile);

      if (uploadError) {
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('task-resources').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
      fileName = selectedFile.name;
    }

    const insertData: any = {
      task_id: taskId,
      user_id: user.id,
      type: newType,
      title: newTitle.trim(),
      content: newType !== 'file' ? (newContent.trim() || null) : null,
      file_url: fileUrl,
      file_name: fileName,
    };

    const { data, error } = await supabase.from('task_resources').insert(insertData).select().single();
    if (data && !error) {
      setResources(prev => [...prev, { ...(data as any), type: (data as any).type as 'text' | 'link' | 'file' }]);
      setNewTitle('');
      setNewContent('');
      setSelectedFile(null);
      setAdding(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setSaving(false);
  };

  const handleDelete = async (resource: TaskResource) => {
    // Delete file from storage if it's a file resource
    if (resource.type === 'file' && resource.file_url) {
      const url = new URL(resource.file_url);
      const pathParts = url.pathname.split('/task-resources/');
      if (pathParts[1]) {
        await supabase.storage.from('task-resources').remove([decodeURIComponent(pathParts[1])]);
      }
    }
    await supabase.from('task_resources').delete().eq('id', resource.id);
    setResources(prev => prev.filter(r => r.id !== resource.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {resources.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center py-1">No resources yet</p>
      )}

      {resources.map(r => (
        <div key={r.id} className="group/res flex items-start gap-2 rounded-md bg-muted/50 p-2">
          <div className="mt-0.5 text-muted-foreground shrink-0">{TYPE_ICON[r.type]}</div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium truncate">{r.title}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{TYPE_LABEL[r.type]}</Badge>
            </div>
            {r.type === 'link' && r.content && (
              <a
                href={r.content.startsWith('http') ? r.content : `https://${r.content}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1 truncate"
              >
                {r.content}
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            )}
            {r.type === 'text' && r.content && (
              <p className="text-[11px] text-muted-foreground line-clamp-3 whitespace-pre-wrap">{r.content}</p>
            )}
            {r.type === 'file' && r.file_url && (
              <a
                href={r.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <Download className="h-2.5 w-2.5 shrink-0" />
                {r.file_name || 'Download'}
              </a>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover/res:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => handleDelete(r)}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded-md border border-border p-2">
          <Select value={newType} onValueChange={v => { setNewType(v as any); setSelectedFile(null); setNewContent(''); }}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">📝 Note</SelectItem>
              <SelectItem value="link">🔗 Link</SelectItem>
              <SelectItem value="file">📎 File</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="h-7 text-xs"
            placeholder="Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          {newType === 'file' ? (
            <div className="space-y-1">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs w-full gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                {selectedFile ? selectedFile.name : 'Choose file...'}
              </Button>
              {selectedFile && (
                <p className="text-[10px] text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          ) : (
            <Textarea
              className="text-xs min-h-[60px]"
              placeholder={newType === 'link' ? 'https://...' : 'Content...'}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAdd(); }}
            />
          )}
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleAdd}
              disabled={!newTitle.trim() || (newType === 'file' && !selectedFile) || saving}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Add
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAdding(false); setSelectedFile(null); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs w-full text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" /> Add Resource
        </Button>
      )}
    </div>
  );
};

export default TaskResources;
