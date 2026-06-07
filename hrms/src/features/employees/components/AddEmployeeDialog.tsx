import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Button } from '../../../components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'
import { useCreateEmployee, useDepartments } from '../hooks/useEmployees'
import type { Gender, Role } from '../../../data/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

const today = new Date().toISOString().slice(0, 10)

export function AddEmployeeDialog({ open, onOpenChange }: Props) {
  const { data: departments = [] } = useDepartments()
  const create = useCreateEmployee()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<Gender>('other')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [joinDate, setJoinDate] = useState(today)
  const [departmentId, setDepartmentId] = useState('')
  const [designation, setDesignation] = useState('')
  const [role, setRole] = useState<Role>('EMPLOYEE')
  const [salary, setSalary] = useState('')

  function reset() {
    setFirstName(''); setLastName(''); setEmail(''); setPhone('')
    setGender('other'); setDateOfBirth(''); setJoinDate(today)
    setDepartmentId(''); setDesignation(''); setRole('EMPLOYEE'); setSalary('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dept = departments.find(d => d.id === departmentId)
    if (!dept) return
    await create.mutateAsync({
      firstName, lastName, email, phone,
      gender, dateOfBirth, joinDate,
      departmentId, departmentName: dept.name,
      designation, role,
      status: 'active',
      salaryMonthly: Number(salary) || 0,
      avatarUrl: '',
      address: '', city: '', state: '',
      managerId: null, managerName: null,
    })
    reset()
    onOpenChange(false)
    // Temporary password is shown via toast in useCreateEmployee hook
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ae-first">First Name</Label>
              <Input id="ae-first" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ae-last">Last Name</Label>
              <Input id="ae-last" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ae-email">Email</Label>
            <Input id="ae-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ae-phone">Phone</Label>
              <Input id="ae-phone" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={v => setGender(v as Gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ae-dob">Date of Birth</Label>
              <Input id="ae-dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ae-join">Join Date</Label>
              <Input id="ae-join" type="date" required value={joinDate} onChange={e => setJoinDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} required>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ae-desig">Designation</Label>
            <Input id="ae-desig" required value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Software Engineer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={v => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ae-salary">Monthly Salary (₹)</Label>
              <Input id="ae-salary" type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)} placeholder="50000" />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !departmentId}>
              {create.isPending ? 'Adding…' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
