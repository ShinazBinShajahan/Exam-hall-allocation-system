import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as XLSX from 'xlsx'

type Student = {
  id: string
  name: string
}

type Subject = {
  code: string
  name: string
  batchName: string
  students: number
  studentData: Student[]
}

type SubjectFormProps = {
  addSubject: (subject: Subject) => void
  editingSubject: Subject | null
  onEditComplete: () => void
}

export default function SubjectForm({ addSubject, editingSubject, onEditComplete }: SubjectFormProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [batchName, setBatchName] = useState('')
  const [studentData, setStudentData] = useState<Student[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [newStudentId, setNewStudentId] = useState('')
  const [newStudentName, setNewStudentName] = useState('')

  useEffect(() => {
    if (editingSubject) {
      setCode(editingSubject.code)
      setName(editingSubject.name)
      setBatchName(editingSubject.batchName)
      setStudentData(editingSubject.studentData)
    } else {
      setCode('')
      setName('')
      setBatchName('')
      setStudentData([])
    }
  }, [editingSubject])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['id', 'name'] })
        setStudentData(jsonData.slice(1) as Student[]) // Assuming first row is header
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const removeUploadedFile = useCallback(() => {
    setFile(null)
    setStudentData([])
  }, [])

  const handleStudentDataChange = useCallback((index: number, field: keyof Student, value: string) => {
    setStudentData(prevData => {
      const newData = [...prevData]
      newData[index] = { ...newData[index], [field]: value }
      return newData
    })
  }, [])

  const removeStudent = useCallback((index: number) => {
    setStudentData(prevData => prevData.filter((_, i) => i !== index))
  }, [])

  const addNewStudent = useCallback(() => {
    if (newStudentId && newStudentName) {
      setStudentData(prevData => [...prevData, { id: newStudentId, name: newStudentName }])
      setNewStudentId('')
      setNewStudentName('')
    }
  }, [newStudentId, newStudentName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newSubject: Subject = {
      code,
      name,
      batchName,
      students: studentData.length,
      studentData
    }
    addSubject(newSubject)
    setCode('')
    setName('')
    setBatchName('')
    setStudentData([])
    setFile(null)
    if (editingSubject) {
      onEditComplete()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">Subject Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="name">Subject Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="batchName">Batch Name</Label>
        <Input
          id="batchName"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="studentData">Upload Student Data (Excel file)</Label>
        <Input
          id="studentData"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="mt-1"
        />
      </div>
      {file && (
        <div>
          <p>Uploaded file: {file.name}</p>
          <Button type="button" onClick={removeUploadedFile} variant="destructive" size="sm">
            Remove File
          </Button>
        </div>
      )}
      {studentData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Student Data Preview</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentData.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={student.id}
                      onChange={(e) => handleStudentDataChange(index, 'id', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={student.name}
                      onChange={(e) => handleStudentDataChange(index, 'name', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" onClick={() => removeStudent(index)} variant="destructive" size="sm">
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex space-x-2">
            <Input
              placeholder="Student ID"
              value={newStudentId}
              onChange={(e) => setNewStudentId(e.target.value)}
            />
            <Input
              placeholder="Student Name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
            <Button type="button" onClick={addNewStudent}>Add Student</Button>
          </div>
          <p className="mt-2">Total Students: {studentData.length}</p>
        </div>
      )}
      <Button type="submit" className="w-full">
        {editingSubject ? 'Update Subject' : 'Add Subject'}
      </Button>
    </form>
  )
}