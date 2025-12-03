import * as React from 'react'
import {
    Card, CardContent, Typography, Grid, Box, Avatar, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress
} from '@mui/material'
import { Title, useGetList, useGetIdentity } from 'react-admin'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

interface User {
    id: number
    name: string
    email: string
    photoUrl?: string
}

interface Project {
    id: number
    name: string
    progress: number
    status: 'active' | 'completed' | 'pending'
    members: number
}

const mockProjects: Project[] = [
    { id: 1, name: 'Horizon UI Dashboard', progress: 85, status: 'active', members: 4 },
    { id: 2, name: 'Mobile App Redesign', progress: 60, status: 'active', members: 3 },
    { id: 3, name: 'API Integration', progress: 100, status: 'completed', members: 2 },
    { id: 4, name: 'User Authentication', progress: 45, status: 'active', members: 5 },
]

const statusColors = {
    active: '#00A3FF',
    completed: '#05CD99',
    pending: '#FF6B6B'
}

export default function Dashboard() {
    const { data: identity } = useGetIdentity()
    const { data: users, total, isLoading } = useGetList('users', {
        pagination: { page: 1, perPage: 5 },
        sort: { field: 'id', order: 'ASC' }
    })

    const stats = [
        { title: 'Total Users', value: total || '0', icon: <PeopleIcon sx={{ fontSize: 40 }} />, color: '#6C5CE7', change: '+12%' },
        { title: 'Active Projects', value: '4', icon: <AssignmentIcon sx={{ fontSize: 40 }} />, color: '#00A3FF', change: '+8%' },
        { title: 'Completed', value: '12', icon: <CheckCircleIcon sx={{ fontSize: 40 }} />, color: '#05CD99', change: '+23%' },
        { title: 'Growth', value: '+23%', icon: <TrendingUpIcon sx={{ fontSize: 40 }} />, color: '#FF6B6B', change: '+5%' },
    ]

    return (
        <Box sx={{ p: 3 }}>
            <Title title="Dashboard" />

            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                Welcome back, {identity?.fullName || 'User'}! 👋
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                Here's what's happening with your projects today.
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{
                            height: '100%',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                            borderRadius: 3,
                            boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0px 8px 30px rgba(0,0,0,0.12)'
                            }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                            {stat.title}
                                        </Typography>
                                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                                            {stat.value}
                                        </Typography>
                                        <Chip
                                            label={stat.change}
                                            size="small"
                                            sx={{
                                                bgcolor: `${stat.color}15`,
                                                color: stat.color,
                                                fontWeight: 600,
                                                fontSize: '0.75rem'
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{
                                        bgcolor: `${stat.color}15`,
                                        borderRadius: 2,
                                        p: 1.5,
                                        color: stat.color
                                    }}>
                                        {stat.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Recent Users Table */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.08)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                Recent Users
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>User</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">Loading...</TableCell>
                                            </TableRow>
                                        ) : users && users.length > 0 ? (
                                            users.map((user: User) => (
                                                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'rgba(108, 92, 231, 0.04)' } }}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar
                                                                src={user.photoUrl}
                                                                alt={user.name}
                                                                sx={{ bgcolor: 'primary.main' }}
                                                            >
                                                                {user.name?.[0] || 'U'}
                                                            </Avatar>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {user.name || 'Unknown'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {user.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label="Active"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#05CD9915',
                                                                color: '#05CD99',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">No users found</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Projects Progress */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.08)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                Active Projects
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {mockProjects.filter(p => p.status === 'active').map((project) => (
                                    <Box key={project.id}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {project.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {project.progress}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={project.progress}
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                bgcolor: 'rgba(108, 92, 231, 0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: statusColors[project.status],
                                                    borderRadius: 3
                                                }
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                                                {project.members}
                                            </Avatar>
                                            <Typography variant="caption" color="text.secondary">
                                                {project.members} members
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
