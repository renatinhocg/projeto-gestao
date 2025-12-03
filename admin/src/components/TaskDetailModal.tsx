import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Box, Typography, IconButton, List, ListItem, ListItemText, Checkbox,
    ListItemSecondaryAction, LinearProgress, Paper, Divider, ListItemAvatar, Avatar,
    Grid, Tab, Tabs, Menu, MenuItem, Chip, ListItemIcon, Tooltip
} from '@mui/material'
import { useGetIdentity } from 'react-admin'
import CloseIcon from '@mui/icons-material/Close'
import ReactMarkdown from 'react-markdown'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import FlagIcon from '@mui/icons-material/Flag'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import DescriptionIcon from '@mui/icons-material/Description'
import HistoryIcon from '@mui/icons-material/History'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'

interface Subtask {
    id: string
    title: string
    completed: boolean
}

interface Attachment {
    id: string
    name: string
    size: number
}

interface User {
    id: number
    name: string
    email: string
    photoUrl?: string
}

interface Comment {
    id: string
    author: User | string
    content: string
    createdAt: Date | string
}

interface Column {
    id: string
    title: string
    order: number
}

interface Task {
    id: number
    title: string
    description: string
    status: string
    columnId?: string
    priority: string
    subtasks?: Subtask[]
    attachments?: Attachment[]
    comments?: Comment[]
    assignees?: User[]
    dueDate?: string
    createdAt?: string
}

interface TaskDetailModalProps {
    open: boolean
    task: Task | null
    columns: Column[]
    assignees: User[]
    onClose: () => void
    onSave: (task: Task) => void
    onDelete: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
    'low': '#579BFC', // Blue
    'medium': '#5559DF', // Purpleish
    'high': '#E2445C' // Red
}

const PRIORITY_LABELS: Record<string, string> = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta'
}

export default function TaskDetailModal({ open, task, columns, assignees, onClose, onSave, onDelete }: TaskDetailModalProps) {
    const { identity } = useGetIdentity()
    const [editedTask, setEditedTask] = React.useState<Task | null>(null)
    const [newSubtask, setNewSubtask] = React.useState('')
    const [newComment, setNewComment] = React.useState('')
    const [tabValue, setTabValue] = React.useState(0)
    const [statusAnchorEl, setStatusAnchorEl] = React.useState<null | HTMLElement>(null)
    const [priorityAnchorEl, setPriorityAnchorEl] = React.useState<null | HTMLElement>(null)
    const [assigneeAnchorEl, setAssigneeAnchorEl] = React.useState<null | HTMLElement>(null)

    React.useEffect(() => {
        if (task) {
            setEditedTask({ ...task })
        }
    }, [task])

    if (!editedTask) return null

    const handleSave = () => {
        if (editedTask) {
            onSave(editedTask)
        }
    }

    const handleSubtaskToggle = (id: string) => {
        if (!editedTask.subtasks) return
        const updatedSubtasks = editedTask.subtasks.map(st =>
            st.id === id ? { ...st, completed: !st.completed } : st
        )
        setEditedTask({ ...editedTask, subtasks: updatedSubtasks })
    }

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return
        const newSub: Subtask = {
            id: `temp-${Date.now()}`,
            title: newSubtask,
            completed: false
        }
        setEditedTask({
            ...editedTask,
            subtasks: [...(editedTask.subtasks || []), newSub]
        })
        setNewSubtask('')
    }

    const handleDeleteSubtask = (id: string) => {
        if (!editedTask.subtasks) return
        setEditedTask({
            ...editedTask,
            subtasks: editedTask.subtasks.filter(st => st.id !== id)
        })
    }

    const handleAddComment = () => {
        if (!newComment.trim()) return
        const comment: Comment = {
            id: `temp-${Date.now()}`,
            author: identity ? { id: Number(identity.id), name: identity.fullName, email: '', photoUrl: identity.avatar } : 'Unknown',
            content: newComment,
            createdAt: new Date()
        }
        setEditedTask({
            ...editedTask,
            comments: [comment, ...(editedTask.comments || [])]
        })
        setNewComment('')
    }

    const handleStatusChange = (columnId: string) => {
        const column = columns.find(c => c.id === columnId)
        setEditedTask({
            ...editedTask,
            columnId: columnId,
            status: column?.title || editedTask.status // Update status string too for backward compat
        })
        setStatusAnchorEl(null)
    }

    const handlePriorityChange = (priority: string) => {
        setEditedTask({ ...editedTask, priority })
        setPriorityAnchorEl(null)
    }

    const handleToggleAssignee = (user: User) => {
        const currentAssignees = editedTask.assignees || []
        const exists = currentAssignees.find(a => a.id === user.id)
        let newAssignees
        if (exists) {
            newAssignees = currentAssignees.filter(a => a.id !== user.id)
        } else {
            newAssignees = [...currentAssignees, user]
        }
        setEditedTask({ ...editedTask, assignees: newAssignees })
    }

    const completedSubtasks = editedTask.subtasks?.filter(st => st.completed).length || 0
    const totalSubtasks = editedTask.subtasks?.length || 0
    const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100

    // Determine current status label and color
    const currentColumn = columns.find(c => c.id === editedTask.columnId) ||
        columns.find(c => c.title.toLowerCase() === (editedTask.status || '').toLowerCase()) ||
        columns[0]

    const currentStatusLabel = currentColumn?.title || editedTask.status || 'Unknown'
    const currentStatusColor = '#C4C4C4' // Default gray, could be dynamic based on column index if desired

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px', height: '80vh' } }}>
            {/* Header with Status and Priority */}
            <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        InputProps={{
                            disableUnderline: true,
                            sx: { fontSize: '1.8rem', fontWeight: 700, color: '#2B3674' }
                        }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                            em Projeto Board •
                        </Typography>

                        {/* Status Chip */}
                        <Chip
                            label={currentStatusLabel}
                            onClick={(e) => setStatusAnchorEl(e.currentTarget)}
                            sx={{
                                bgcolor: currentStatusColor,
                                color: 'white',
                                fontWeight: 600,
                                borderRadius: '8px',
                                height: '28px'
                            }}
                        />
                        <Menu
                            anchorEl={statusAnchorEl}
                            open={Boolean(statusAnchorEl)}
                            onClose={() => setStatusAnchorEl(null)}
                        >
                            {columns.map((col) => (
                                <MenuItem key={col.id} onClick={() => handleStatusChange(col.id)}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#C4C4C4', mr: 1 }} />
                                    {col.title}
                                </MenuItem>
                            ))}
                        </Menu>

                        {/* Priority Chip */}
                        <Chip
                            label={PRIORITY_LABELS[editedTask.priority] || editedTask.priority}
                            onClick={(e) => setPriorityAnchorEl(e.currentTarget)}
                            sx={{
                                bgcolor: PRIORITY_COLORS[editedTask.priority] || '#C4C4C4',
                                color: 'white',
                                fontWeight: 600,
                                borderRadius: '8px',
                                height: '28px'
                            }}
                        />
                        <Menu
                            anchorEl={priorityAnchorEl}
                            open={Boolean(priorityAnchorEl)}
                            onClose={() => setPriorityAnchorEl(null)}
                        >
                            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                                <MenuItem key={key} onClick={() => handlePriorityChange(key)}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PRIORITY_COLORS[key], mr: 1 }} />
                                    {label}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                </Box>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Box>

            <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
                <Grid container sx={{ height: '100%' }}>
                    {/* Left Column: Metadata & Subtasks */}
                    <Grid item xs={12} md={4} sx={{ borderRight: '1px solid #E0E0E0', p: 3, overflowY: 'auto' }}>

                        {/* Responsible & Due Date */}
                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                        RESPONSÁVEL
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                                        {editedTask.assignees?.map((assignee) => (
                                            <Tooltip key={assignee.id} title={assignee.name}>
                                                <Avatar
                                                    src={assignee.photoUrl}
                                                    sx={{ width: 32, height: 32, bgcolor: '#A3AED0', border: '2px solid white' }}
                                                >
                                                    {assignee.name[0]}
                                                </Avatar>
                                            </Tooltip>
                                        ))}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => setAssigneeAnchorEl(e.currentTarget)}
                                            sx={{ width: 32, height: 32, bgcolor: '#F4F7FE', border: '1px dashed #A3AED0' }}
                                        >
                                            <AddIcon fontSize="small" sx={{ color: '#A3AED0' }} />
                                        </IconButton>
                                        <Menu
                                            anchorEl={assigneeAnchorEl}
                                            open={Boolean(assigneeAnchorEl)}
                                            onClose={() => setAssigneeAnchorEl(null)}
                                        >
                                            {assignees.map((user) => (
                                                <MenuItem key={user.id} onClick={() => handleToggleAssignee(user)}>
                                                    <Checkbox checked={Boolean(editedTask.assignees?.find(a => a.id === user.id))} />
                                                    <ListItemAvatar>
                                                        <Avatar src={user.photoUrl} sx={{ width: 24, height: 24 }}>{user.name[0]}</Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText primary={user.name} />
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                        DATA DE ENTREGA
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CalendarTodayIcon sx={{ fontSize: 20, color: '#A3AED0' }} />
                                        <TextField
                                            type="date"
                                            variant="standard"
                                            value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ''}
                                            onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: { fontSize: '0.875rem' }
                                            }}
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Description */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <DescriptionIcon color="action" fontSize="small" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Descrição</Typography>
                            </Box>
                            <TextField
                                multiline
                                minRows={3}
                                fullWidth
                                placeholder="Adicionar descrição..."
                                value={editedTask.description}
                                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F4F7FE' },
                                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                                }}
                            />
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Subtasks */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FormatListBulletedIcon color="action" fontSize="small" />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Subtarefas</Typography>
                                </Box>
                                <Typography variant="caption" color="textSecondary">{completedSubtasks}/{totalSubtasks}</Typography>
                            </Box>

                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ mb: 2, borderRadius: 5, height: 6, bgcolor: '#E9EDF7', '& .MuiLinearProgress-bar': { bgcolor: '#4318FF' } }}
                            />

                            <List dense sx={{ p: 0 }}>
                                {editedTask.subtasks?.map((subtask) => (
                                    <ListItem key={subtask.id} sx={{ p: 0, mb: 1 }}>
                                        <Checkbox
                                            checked={subtask.completed}
                                            onChange={() => handleSubtaskToggle(subtask.id)}
                                            sx={{ p: 0.5, color: '#A3AED0', '&.Mui-checked': { color: '#4318FF' } }}
                                        />
                                        <ListItemText
                                            primary={subtask.title}
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                sx: { textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? '#A3AED0' : 'textPrimary' }
                                            }}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" size="small" onClick={() => handleDeleteSubtask(subtask.id)}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>

                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <AddIcon fontSize="small" sx={{ color: '#A3AED0', mr: 1 }} />
                                <TextField
                                    placeholder="Adicionar subtarefa"
                                    variant="standard"
                                    fullWidth
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddSubtask() }}
                                    InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                                />
                            </Box>
                        </Box>
                    </Grid>

                    {/* Right Column: Updates, Files, Activity */}
                    <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                                <Tab label="Atualizações" sx={{ textTransform: 'none', fontWeight: 600 }} />
                                <Tab label="Arquivos" sx={{ textTransform: 'none', fontWeight: 600 }} />
                                <Tab label="Log de Atividades" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            </Tabs>
                        </Box>

                        <Box sx={{ p: 3, flex: 1, overflowY: 'auto', bgcolor: '#FAFCFE' }}>
                            {tabValue === 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                                        <Avatar sx={{ bgcolor: '#4318FF' }}>{identity?.fullName?.[0] || 'U'}</Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Paper elevation={0} sx={{ p: 2, border: '1px solid #E0E0E0', borderRadius: '12px', mb: 1 }}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    placeholder="Escreva uma atualização..."
                                                    variant="standard"
                                                    InputProps={{ disableUnderline: true }}
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                />
                                            </Paper>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton size="small" onClick={() => setNewComment(prev => prev + '**bold** ')}><FormatBoldIcon /></IconButton>
                                                    <IconButton size="small" onClick={() => setNewComment(prev => prev + '_italic_ ')}><FormatItalicIcon /></IconButton>
                                                    <IconButton size="small" onClick={() => setNewComment(prev => prev + '__underline__ ')}><FormatUnderlinedIcon /></IconButton>
                                                    <IconButton size="small" onClick={() => setNewComment(prev => prev + '\n- ')}><FormatListBulletedIcon /></IconButton>
                                                    <IconButton size="small" component="label">
                                                        <AttachFileIcon />
                                                        <input type="file" hidden onChange={(e) => {
                                                            if (e.target.files && e.target.files.length > 0) {
                                                                const file = e.target.files[0]
                                                                setNewComment(prev => prev + ` [Arquivo: ${file.name}] `)
                                                            }
                                                        }} />
                                                    </IconButton>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    onClick={handleAddComment}
                                                    sx={{ bgcolor: '#4318FF', borderRadius: '8px', textTransform: 'none' }}
                                                >
                                                    Atualizar
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <List>
                                        {editedTask.comments?.map((comment) => (
                                            <ListItem key={comment.id} alignItems="flex-start" sx={{ px: 0 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: '#A3AED0' }}>
                                                        {typeof comment.author === 'object' ? comment.author.name?.[0] : 'U'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                {typeof comment.author === 'object' ? comment.author.name : 'Unknown'}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {new Date(comment.createdAt).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ mt: 1, '& p': { m: 0 } }}>
                                                            <ReactMarkdown>{comment.content}</ReactMarkdown>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                            {tabValue === 1 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A3AED0' }}>
                                    <AttachFileIcon sx={{ fontSize: 48, mb: 2 }} />
                                    <Typography>Nenhum arquivo anexado</Typography>
                                    <Button startIcon={<AddIcon />} sx={{ mt: 2 }}>Adicionar Arquivo</Button>
                                </Box>
                            )}
                            {tabValue === 2 && (
                                <List>
                                    <ListItem>
                                        <ListItemIcon><HistoryIcon /></ListItemIcon>
                                        <ListItemText primary="Tarefa criada" secondary={new Date(editedTask.createdAt || Date.now()).toLocaleString()} />
                                    </ListItem>
                                </List>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid #E0E0E0' }}>
                <Button onClick={onDelete} color="error" startIcon={<DeleteIcon />}>
                    Excluir Tarefa
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#4318FF', borderRadius: '8px' }}>
                    Salvar Alterações
                </Button>
            </DialogActions>
        </Dialog>
    )
}
