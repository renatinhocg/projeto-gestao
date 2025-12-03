import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Avatar,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    CircularProgress,
    Tooltip,
    Tabs,
    Tab,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Autocomplete
} from '@mui/material'
import {
    Add as AddIcon,
    DeleteOutline as DeleteIcon,
    MailOutline as MailIcon,
    WorkOutline as WorkIcon,
    Security as SecurityIcon,
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { useGetIdentity } from 'react-admin'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Sub-component for User Management (The old Teams view)
const UserManagement = () => {
    const { data: identity } = useGetIdentity()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        isAdmin: false,
        photoUrl: ''
    })
    const [creating, setCreating] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/users?_end=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to fetch users', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password) return
        setCreating(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            })

            if (response.ok) {
                setOpenModal(false)
                setNewUser({ name: '', email: '', password: '', isAdmin: false, photoUrl: '' })
                fetchUsers()
            } else {
                const err = await response.json()
                alert(err.error || 'Erro ao criar usuário')
            }
        } catch (e) {
            console.error(e)
            alert('Erro ao criar usuário')
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== id))
            } else {
                alert('Erro ao remover usuário')
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" color="textSecondary">
                    Gerencie todos os usuários do sistema.
                </Typography>
                {identity?.isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenModal(true)}
                        sx={{ bgcolor: '#4318FF', borderRadius: '10px', textTransform: 'none' }}
                    >
                        Novo Usuário
                    </Button>
                )}
            </Box>

            {loading ? <CircularProgress /> : (
                <Grid container spacing={3}>
                    {users.map((user) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                            <Card sx={{ borderRadius: '20px', height: '100%', position: 'relative' }}>
                                <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                                    <Avatar src={user.photoUrl} sx={{ width: 60, height: 60, mx: 'auto', mb: 2 }}>
                                        {!user.photoUrl && (user.name?.[0] || 'U')}
                                    </Avatar>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                                    <Typography variant="caption" display="block" sx={{ mb: 2 }}>{user.email}</Typography>
                                    <Chip label={user.isAdmin ? 'Admin' : 'Membro'} size="small" color={user.isAdmin ? 'primary' : 'default'} />
                                    {identity?.isAdmin && user.id !== identity.id && (
                                        <IconButton size="small" onClick={() => handleDeleteUser(user.id)} sx={{ position: 'absolute', top: 5, right: 5 }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField label="Nome" fullWidth value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                        <TextField label="Email" fullWidth value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        <TextField label="Senha" type="password" fullWidth value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                        <TextField label="Foto URL" fullWidth value={newUser.photoUrl} onChange={e => setNewUser({ ...newUser, photoUrl: e.target.value })} />
                        <FormControlLabel control={<Switch checked={newUser.isAdmin} onChange={e => setNewUser({ ...newUser, isAdmin: e.target.checked })} />} label="Admin" />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreateUser} disabled={creating}>Criar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

// Sub-component for Teams Management
const TeamManagement = () => {
    const { data: identity } = useGetIdentity()
    const [teams, setTeams] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([]) // For selection
    const [loading, setLoading] = useState(true)
    const [createModal, setCreateModal] = useState(false)
    const [detailsModal, setDetailsModal] = useState<any>(null)
    const [newTeam, setNewTeam] = useState({ name: '', logoUrl: '' })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [selectedUserToAdd, setSelectedUserToAdd] = useState<string[]>([])

    const fetchTeams = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/teams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) setTeams(await response.json())
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/users?_end=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) setUsers(await response.json())
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        fetchTeams()
        fetchUsers()
    }, [])

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0])
        }
    }

    const handleCreateTeam = async () => {
        if (!newTeam.name) return
        setUploading(true)
        try {
            const token = localStorage.getItem('token')
            let finalLogoUrl = newTeam.logoUrl

            if (selectedFile) {
                const formData = new FormData()
                formData.append('file', selectedFile)

                const uploadRes = await fetch(`${API_URL}/s3/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                })

                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    finalLogoUrl = data.publicUrl
                } else {
                    alert('Erro ao fazer upload da logo')
                    setUploading(false)
                    return
                }
            }

            const response = await fetch(`${API_URL}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...newTeam, logoUrl: finalLogoUrl })
            })
            if (response.ok) {
                setCreateModal(false)
                setNewTeam({ name: '', logoUrl: '' })
                setSelectedFile(null)
                fetchTeams()
            }
        } catch (e) { console.error(e) }
        finally { setUploading(false) }
    }

    const handleAddMember = async () => {
        if (!selectedUserToAdd || !detailsModal) return
        const userIds = Array.isArray(selectedUserToAdd) ? selectedUserToAdd : [selectedUserToAdd]
        if (userIds.length === 0) return

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/teams/${detailsModal.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userIds })
            })
            if (response.ok) {
                // Refresh teams to update the specific team in the list (or refetch just one)
                fetchTeams()
                // Also update local details modal state if we want instant feedback, 
                // but simpler to close and reopen or just refetch.
                // Let's refetch and find the updated team to update modal
                const updatedTeamsRes = await fetch(`${API_URL}/teams`, { headers: { 'Authorization': `Bearer ${token}` } })
                const updatedTeams = await updatedTeamsRes.json()
                setTeams(updatedTeams)
                setDetailsModal(updatedTeams.find((t: any) => t.id === detailsModal.id))
                setSelectedUserToAdd([])
            }
        } catch (e) { console.error(e) }
    }

    const handleRemoveMember = async (userId: number) => {
        if (!detailsModal) return
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_URL}/teams/${detailsModal.id}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            // Refresh
            const updatedTeamsRes = await fetch(`${API_URL}/teams`, { headers: { 'Authorization': `Bearer ${token}` } })
            const updatedTeams = await updatedTeamsRes.json()
            setTeams(updatedTeams)
            setDetailsModal(updatedTeams.find((t: any) => t.id === detailsModal.id))
        } catch (e) { console.error(e) }
    }

    // Filter users not in this team
    const availableUsers = users.filter(u => !detailsModal?.members?.some((m: any) => m.id === u.id))

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" color="textSecondary">
                    Crie equipes e organize seus membros.
                </Typography>
                {identity?.isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateModal(true)}
                        sx={{ bgcolor: '#4318FF', borderRadius: '10px', textTransform: 'none' }}
                    >
                        Nova Equipe
                    </Button>
                )}
            </Box>

            {loading ? <CircularProgress /> : (
                <Grid container spacing={3}>
                    {teams.map((team) => (
                        <Grid item xs={12} sm={6} md={4} key={team.id}>
                            <Card
                                sx={{
                                    borderRadius: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid rgba(0,0,0,0.03)',
                                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)',
                                        border: '1px solid rgba(67, 24, 255, 0.1)'
                                    }
                                }}
                                onClick={() => setDetailsModal(team)}
                            >
                                <CardContent sx={{ textAlign: 'center', pt: 5, pb: 4 }}>
                                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                        <Avatar
                                            src={team.logoUrl}
                                            sx={{
                                                width: 88,
                                                height: 88,
                                                mx: 'auto',
                                                bgcolor: '#fff',
                                                boxShadow: '0px 8px 24px rgba(67, 24, 255, 0.15)',
                                                border: '4px solid white'
                                            }}
                                        >
                                            {!team.logoUrl && <GroupIcon fontSize="large" sx={{ color: '#4318FF' }} />}
                                        </Avatar>
                                        {team._count?.members > 0 && (
                                            <Box sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                width: 24,
                                                height: 24,
                                                bgcolor: '#05CD99',
                                                borderRadius: '50%',
                                                border: '3px solid white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <CheckCircleIcon sx={{ width: 14, height: 14, color: 'white' }} />
                                            </Box>
                                        )}
                                    </Box>

                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2B3674', mb: 0.5 }}>{team.name}</Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                        {team._count?.members || 0} Membros
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
                                        {team.members?.slice(0, 4).map((m: any, index: number) => (
                                            <Tooltip title={m.name} key={m.id}>
                                                <Avatar
                                                    src={m.photoUrl}
                                                    sx={{
                                                        width: 34,
                                                        height: 34,
                                                        ml: index === 0 ? 0 : -1.5,
                                                        border: '3px solid white',
                                                        boxShadow: '0px 4px 10px rgba(0,0,0,0.05)',
                                                        zIndex: 10 - index
                                                    }}
                                                />
                                            </Tooltip>
                                        ))}
                                        {(team.members?.length || 0) > 4 && (
                                            <Avatar sx={{
                                                width: 34,
                                                height: 34,
                                                ml: -1.5,
                                                border: '3px solid white',
                                                fontSize: 12,
                                                bgcolor: '#F4F7FE',
                                                color: '#A3AED0',
                                                fontWeight: 700,
                                                zIndex: 0
                                            }}>
                                                +{team.members.length - 4}
                                            </Avatar>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create Team Modal */}
            <Dialog open={createModal} onClose={() => setCreateModal(false)} fullWidth maxWidth="xs">
                <DialogTitle>Nova Equipe</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField label="Nome da Equipe" fullWidth value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<CloudUploadIcon />}
                            >
                                Upload Logo
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                            </Button>
                            {selectedFile && <Typography variant="caption">{selectedFile.name}</Typography>}
                        </Box>
                        {newTeam.logoUrl && <Typography variant="caption" color="textSecondary">Ou use URL: {newTeam.logoUrl}</Typography>}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreateTeam} disabled={uploading}>
                        {uploading ? <CircularProgress size={24} /> : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Team Details Modal */}
            <Dialog open={!!detailsModal} onClose={() => setDetailsModal(null)} fullWidth maxWidth="sm">
                {detailsModal && (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={detailsModal.logoUrl}><GroupIcon /></Avatar>
                            {detailsModal.name}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>Membros ({detailsModal.members?.length || 0})</Typography>
                            <List>
                                {detailsModal.members?.map((member: any) => (
                                    <ListItem key={member.id}>
                                        <ListItemAvatar>
                                            <Avatar src={member.photoUrl} />
                                        </ListItemAvatar>
                                        <ListItemText primary={member.name} secondary={member.email} />
                                        {identity?.isAdmin && (
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" onClick={() => handleRemoveMember(member.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        )}
                                    </ListItem>
                                ))}
                            </List>

                            {identity?.isAdmin && (
                                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2B3674' }}>Adicionar Membros</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                        <Autocomplete
                                            multiple
                                            fullWidth
                                            size="small"
                                            options={availableUsers}
                                            getOptionLabel={(option) => option.name}
                                            value={availableUsers.filter(u => (selectedUserToAdd as string[]).includes(u.id))}
                                            onChange={(_, newValue) => {
                                                setSelectedUserToAdd(newValue.map(v => v.id))
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Selecionar Usuários"
                                                    placeholder="Busque por nome..."
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                            bgcolor: '#F4F7FE',
                                                            '& fieldset': { borderColor: 'transparent' },
                                                            '&:hover fieldset': { borderColor: '#4318FF' },
                                                            '&.Mui-focused fieldset': { borderColor: '#4318FF' }
                                                        }
                                                    }}
                                                />
                                            )}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip
                                                        label={option.name}
                                                        size="small"
                                                        avatar={<Avatar src={option.photoUrl} sx={{ width: 24, height: 24 }} />}
                                                        {...getTagProps({ index })}
                                                        sx={{
                                                            borderRadius: '8px',
                                                            bgcolor: 'rgba(67, 24, 255, 0.1)',
                                                            color: '#4318FF',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                ))
                                            }
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleAddMember}
                                            disabled={!selectedUserToAdd || (Array.isArray(selectedUserToAdd) && selectedUserToAdd.length === 0)}
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                height: 40,
                                                bgcolor: '#4318FF',
                                                boxShadow: '0px 4px 12px rgba(67, 24, 255, 0.2)',
                                                '&:hover': { bgcolor: '#3311CC' }
                                            }}
                                        >
                                            Adicionar
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailsModal(null)}>Fechar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    )
}

export default function Teams() {
    const [tab, setTab] = useState(0)

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2B3674', mb: 1 }}>
                Gestão de Equipes
            </Typography>

            <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #E0E0E0', overflow: 'hidden', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
                    <Tab label="Equipes" />
                    <Tab label="Todos os Usuários" />
                </Tabs>
                <Box sx={{ p: 3 }}>
                    {tab === 0 ? <TeamManagement /> : <UserManagement />}
                </Box>
            </Paper>
        </Box>
    )
}
