import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Avatar,
    Chip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    LinearProgress
} from '@mui/material'
import {
    Add as AddIcon,
    CalendarToday as CalendarIcon,
    Group as GroupIcon,
    Assignment as TaskIcon,
    ArrowForward as ArrowIcon,
    DeleteOutline as DeleteIcon
} from '@mui/icons-material'
import { useGetIdentity } from 'react-admin'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Projects() {
    const { data: identity } = useGetIdentity()
    const navigate = useNavigate()
    const [projects, setProjects] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [createModal, setCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)

    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        dueDate: '',
        teamId: ''
    })

    const fetchProjects = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Failed to fetch projects', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchTeams = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/teams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                setTeams(await response.json())
            }
        } catch (error) {
            console.error('Failed to fetch teams', error)
        }
    }

    useEffect(() => {
        fetchProjects()
        fetchTeams()
    }, [])

    const handleCreateProject = async () => {
        if (!newProject.name) return
        setCreating(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newProject)
            })

            if (response.ok) {
                setCreateModal(false)
                setNewProject({ name: '', description: '', dueDate: '', teamId: '' })
                fetchProjects()
            } else {
                alert('Erro ao criar projeto')
            }
        } catch (e) {
            console.error(e)
            alert('Erro ao criar projeto')
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteProject = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        if (!confirm('Tem certeza? Todas as tarefas e colunas deste projeto serão excluídas.')) return
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            fetchProjects()
        } catch (e) {
            console.error(e)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Sem data'
        return new Date(dateString).toLocaleDateString('pt-BR')
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2B3674', mb: 1 }}>
                        Projetos
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Gerencie seus projetos e acompanhe o progresso.
                    </Typography>
                </Box>
                {identity?.isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateModal(true)}
                        sx={{
                            bgcolor: '#4318FF',
                            borderRadius: '10px',
                            textTransform: 'none',
                            px: 3,
                            py: 1.5,
                            boxShadow: '0px 4px 12px rgba(67, 24, 255, 0.2)'
                        }}
                    >
                        Novo Projeto
                    </Button>
                )}
            </Box>

            {loading ? <CircularProgress /> : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                            <Card
                                sx={{
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid rgba(0,0,0,0.03)',
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)',
                                        border: '1px solid rgba(67, 24, 255, 0.1)'
                                    }
                                }}
                                onClick={() => navigate(`/kanban?projectId=${project.id}`)}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                variant="rounded"
                                                sx={{ bgcolor: '#F4F7FE', color: '#4318FF' }}
                                            >
                                                {project.name[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2B3674', lineHeight: 1.2 }}>
                                                    {project.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Criado em {formatDate(project.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {identity?.isAdmin && (
                                            <Button
                                                size="small"
                                                color="error"
                                                sx={{ minWidth: 30, p: 0.5 }}
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </Button>
                                        )}
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        sx={{
                                            mb: 3,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            height: 40
                                        }}
                                    >
                                        {project.description || 'Sem descrição'}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <Chip
                                            icon={<GroupIcon sx={{ fontSize: 16 }} />}
                                            label={project.team ? project.team.name : 'Geral'}
                                            size="small"
                                            sx={{ borderRadius: '8px', bgcolor: '#F4F7FE', color: '#A3AED0', fontWeight: 600 }}
                                        />
                                        <Chip
                                            icon={<CalendarIcon sx={{ fontSize: 16 }} />}
                                            label={formatDate(project.dueDate)}
                                            size="small"
                                            sx={{ borderRadius: '8px', bgcolor: '#F4F7FE', color: '#A3AED0', fontWeight: 600 }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TaskIcon sx={{ color: '#4318FF', fontSize: 20 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2B3674' }}>
                                                {project._count?.tasks || 0} Tarefas
                                            </Typography>
                                        </Box>
                                        <ArrowIcon sx={{ color: '#4318FF', fontSize: 20 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={createModal} onClose={() => setCreateModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>Novo Projeto</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nome do Projeto"
                            fullWidth
                            value={newProject.name}
                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                        />
                        <TextField
                            label="Descrição"
                            fullWidth
                            multiline
                            rows={3}
                            value={newProject.description}
                            onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                        />
                        <TextField
                            label="Data de Entrega"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={newProject.dueDate}
                            onChange={e => setNewProject({ ...newProject, dueDate: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Equipe Responsável</InputLabel>
                            <Select
                                value={newProject.teamId}
                                label="Equipe Responsável"
                                onChange={e => setNewProject({ ...newProject, teamId: e.target.value })}
                            >
                                <MenuItem value=""><em>Nenhuma (Geral)</em></MenuItem>
                                {teams.map(team => (
                                    <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreateProject} disabled={creating}>
                        {creating ? <CircularProgress size={24} /> : 'Criar Projeto'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
