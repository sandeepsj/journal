import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react'

export interface RichTextEditorHandle {
  /** Get plain text (for word count, embeddings, Eemo) */
  getText: () => string
  /** Insert text at current cursor position */
  insertAtCursor: (text: string) => void
  /** The wrapper DOM element (for DrawingCanvas sizeRef) */
  wrapperElement: HTMLDivElement | null
  /** Focus the editor */
  focus: () => void
  /** Whether undo is available */
  canUndo: () => boolean
  /** Whether redo is available */
  canRedo: () => boolean
  /** Trigger undo */
  undo: () => void
  /** Trigger redo */
  redo: () => void
  /** Toggle bold */
  toggleBold: () => void
  /** Toggle italic */
  toggleItalic: () => void
  /** Toggle bullet list */
  toggleBulletList: () => void
  /** Toggle ordered list */
  toggleOrderedList: () => void
  /** Toggle heading level */
  toggleHeading: (level: 1 | 2 | 3) => void
  /** Check if a mark/node is active */
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean
}

export interface RichTextEditorProps {
  content: string
  onUpdate: (html: string) => void
  /** Called whenever the editor transaction updates (for undo/redo state) */
  onTransaction?: () => void
  textColor?: string
  editable?: boolean
  placeholder?: string
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    { content, onUpdate, onTransaction, textColor = '#2C2825', editable = true, placeholder = 'Start writing...' },
    ref
  ) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    // Track the latest callbacks in refs so the editor config closure stays fresh
    const onUpdateRef = useRef(onUpdate)
    const onTransactionRef = useRef(onTransaction)
    const lastExternalContent = useRef(content)

    onUpdateRef.current = onUpdate
    onTransactionRef.current = onTransaction

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          undoRedo: {
            depth: 30,
          },
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content,
      editable,
      onUpdate: ({ editor: e }) => {
        const html = e.getHTML()
        lastExternalContent.current = html
        onUpdateRef.current(html)
      },
      onTransaction: () => {
        onTransactionRef.current?.()
      },
    })

    // Sync editable state
    useEffect(() => {
      if (editor) editor.setEditable(editable)
    }, [editor, editable])

    // Sync text color via CSS custom property
    useEffect(() => {
      const el = wrapperRef.current?.querySelector('.ProseMirror') as HTMLElement | null
      if (el) el.style.color = textColor
    }, [textColor, editor])

    // Sync content from outside (reload from Drive, etc.)
    // Only update if the editor content differs to avoid cursor jumps
    useEffect(() => {
      if (!editor) return
      if (content === lastExternalContent.current) return
      lastExternalContent.current = content
      const currentHTML = editor.getHTML()
      if (currentHTML !== content) {
        editor.commands.setContent(content)
      }
    }, [editor, content])

    useImperativeHandle(ref, () => ({
      getText: () => editor?.getText() ?? '',
      insertAtCursor: (text: string) => {
        editor?.commands.insertContent(text)
        editor?.commands.focus()
      },
      wrapperElement: wrapperRef.current,
      focus: () => editor?.commands.focus(),
      canUndo: () => editor?.can().undo() ?? false,
      canRedo: () => editor?.can().redo() ?? false,
      undo: () => { editor?.commands.undo() },
      redo: () => { editor?.commands.redo() },
      toggleBold: () => { editor?.chain().focus().toggleBold().run() },
      toggleItalic: () => { editor?.chain().focus().toggleItalic().run() },
      toggleBulletList: () => { editor?.chain().focus().toggleBulletList().run() },
      toggleOrderedList: () => { editor?.chain().focus().toggleOrderedList().run() },
      toggleHeading: (level: 1 | 2 | 3) => { editor?.chain().focus().toggleHeading({ level }).run() },
      isActive: (name: string, attrs?: Record<string, unknown>) => editor?.isActive(name, attrs) ?? false,
    }), [editor])

    return (
      <div ref={wrapperRef} className="rich-text-editor">
        <EditorContent editor={editor} />
      </div>
    )
  }
)
