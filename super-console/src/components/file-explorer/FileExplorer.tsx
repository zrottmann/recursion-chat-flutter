'use client'

import { useState, useEffect } from 'react'
import { Folder, File, ChevronRight, ChevronDown, Upload, Download } from 'lucide-react'
import { useAppwrite } from '@/lib/appwrite-context'
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { Query } from 'appwrite'

interface FileNode {
  $id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  size?: number
  content?: string
}

interface FileExplorerProps {
  sessionId: string | null
}

export function FileExplorer({ sessionId }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const { databases } = useAppwrite()

  useEffect(() => {
    if (sessionId) {
      loadFiles()
    }
  }, [sessionId])

  const loadFiles = async () => {
    if (!sessionId) return
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FILES,
        [
          Query.equal('sessionId', sessionId),
          Query.orderAsc('path')
        ]
      )
      
      // Build tree structure
      const tree = buildFileTree(response.documents)
      setFiles(tree)
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const buildFileTree = (flatFiles: any[]): FileNode[] => {
    const root: FileNode[] = []
    const map = new Map<string, FileNode>()
    
    flatFiles.forEach(file => {
      const node: FileNode = {
        $id: file.$id,
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        content: file.content,
        children: file.type === 'folder' ? [] : undefined
      }
      
      map.set(file.path, node)
      
      const parentPath = file.path.substring(0, file.path.lastIndexOf('/'))
      if (parentPath && map.has(parentPath)) {
        const parent = map.get(parentPath)!
        if (parent.children) {
          parent.children.push(node)
        }
      } else {
        root.push(node)
      }
    })
    
    return root
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.$id)
    const isSelected = selectedFile === node.$id
    
    return (
      <div key={node.$id}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.$id)
            } else {
              setSelectedFile(node.$id)
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="w-4 h-4 text-gray-500" />
            </>
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a session to view files
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">Files</span>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-accent rounded" title="Upload">
            <Upload className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-accent rounded" title="Download">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {files.length > 0 ? (
          files.map(node => renderNode(node))
        ) : (
          <div className="p-4 text-muted-foreground text-sm text-center">
            No files yet
          </div>
        )}
      </div>
    </div>
  )
}