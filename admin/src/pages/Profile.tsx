import * as React from 'react'
import { Card, CardContent, Typography, Box, TextField, Button, Avatar, Grid } from '@mui/material'
import { Title, useGetIdentity, useNotify } from 'react-admin'
import PhotoInput from '../PhotoInput'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Profile() {
    const { data: identity, refetch } = useGetIdentity()
    const notify = useNotify()
    const [name, setName] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [oab, setOab] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (identity) {
            setName(identity.fullName || '')
            setEmail(identity.id ? '' : '') // We'll need to fetch full user data

            // Fetch full user data to get OAB
            const fetchUser = async () => {
                try {
                    const token = localStorage.getItem('token')
                    const res = await fetch(`${apiUrl}/users/${identity.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setOab(data.oab || '')
                        setEmail(data.email || '')
                    }
                } catch (e) {
                    console.error(e)
                }
            }
            fetchUser()
        }
    }, [identity])

    const handleSave = async () => {
        if (!identity?.id) return

        setLoading(true)
        try {
            const body: any = { name, oab }
            if (password) body.password = password

            const token = localStorage.getItem('token')
            const res = await fetch(`${apiUrl}/users/${identity.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error('Update failed')

            notify('Profile updated successfully', { type: 'success' })
            refetch()
            setPassword('')
        } catch (err) {
            notify('Failed to update profile', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <Title title="Profile" />

            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                My Profile
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                Manage your account settings and preferences
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Avatar
                                src={identity?.avatar}
                                alt={identity?.fullName}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    mx: 'auto',
                                    mb: 2,
                                    bgcolor: 'primary.main',
                                    fontSize: 48
                                }}
                            >
                                {identity?.fullName?.[0] || 'U'}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {identity?.fullName || 'User'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Administrator
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.08)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                Personal Information
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    label="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                />

                                <TextField
                                    label="OAB (ex: RJ123456)"
                                    value={oab}
                                    onChange={(e) => setOab(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                />

                                <TextField
                                    label="Email"
                                    value={email}
                                    disabled
                                    fullWidth
                                    variant="outlined"
                                    helperText="Email cannot be changed"
                                />

                                <TextField
                                    label="New Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    helperText="Leave blank to keep current password"
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setName(identity?.fullName || '')
                                            setPassword('')
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleSave}
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}
