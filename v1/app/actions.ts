"use server"
import path from "path"
import { promises as fsPromises } from "fs"

// Define the documents directory
const DOCUMENTS_DIR = path.join(process.cwd(), "documents")

// Ensure the documents directory exists
async function ensureDocumentsDir() {
  try {
    await fsPromises.access(DOCUMENTS_DIR)
  } catch (error) {
    await fsPromises.mkdir(DOCUMENTS_DIR, { recursive: true })
  }
}

// Interface for document data
interface DocumentData {
  id: string
  title: string
  content: string
  lastModified: number
  fontFamily?: string
}

// Get a list of all documents
export async function getDocumentList() {
  await ensureDocumentsDir()

  const files = await fsPromises.readdir(DOCUMENTS_DIR)
  const jsonFiles = files.filter((file) => file.endsWith(".json"))

  const documents = await Promise.all(
    jsonFiles.map(async (file) => {
      const filePath = path.join(DOCUMENTS_DIR, file)
      const content = await fsPromises.readFile(filePath, "utf-8")
      try {
        const doc = JSON.parse(content) as DocumentData
        return {
          id: doc.id,
          title: doc.title,
          lastModified: doc.lastModified,
        }
      } catch (error) {
        console.error(`Error parsing document ${file}:`, error)
        return null
      }
    }),
  )

  // Filter out any null values and sort by last modified (newest first)
  return documents.filter(Boolean).sort((a, b) => b!.lastModified - a!.lastModified) as Array<{
    id: string
    title: string
    lastModified: number
  }>
}

// Get a specific document by ID
export async function getDocument(id: string) {
  await ensureDocumentsDir()

  const filePath = path.join(DOCUMENTS_DIR, `${id}.json`)

  try {
    const content = await fsPromises.readFile(filePath, "utf-8")
    return JSON.parse(content) as DocumentData
  } catch (error) {
    console.error(`Error reading document ${id}:`, error)
    return null
  }
}

// Save a document
export async function saveDocument({
  id,
  title,
  content,
  fontFamily,
}: {
  id?: string
  title: string
  content: string
  fontFamily?: string
}) {
  await ensureDocumentsDir()

  const documentId = id || Date.now().toString()
  const filePath = path.join(DOCUMENTS_DIR, `${documentId}.json`)

  const document: DocumentData = {
    id: documentId,
    title: title || "Untitled Document",
    content,
    lastModified: Date.now(),
    fontFamily,
  }

  await fsPromises.writeFile(filePath, JSON.stringify(document, null, 2))

  console.log(`Document saved to: ${filePath}`)

  return documentId
}

// Delete a document
export async function deleteDocument(id: string) {
  await ensureDocumentsDir()

  const filePath = path.join(DOCUMENTS_DIR, `${id}.json`)

  try {
    await fsPromises.unlink(filePath)
    return true
  } catch (error) {
    console.error(`Error deleting document ${id}:`, error)
    return false
  }
}

// Add this function to get the documents directory path
export async function getDocumentsDirectoryPath() {
  return DOCUMENTS_DIR
}
