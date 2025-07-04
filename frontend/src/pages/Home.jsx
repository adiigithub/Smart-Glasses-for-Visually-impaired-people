import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Visibility,
  AccessibilityNew,
  Favorite,
  LocationOn,
  Notifications,
  Security,
  Speed
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: `url(https://source.unsplash.com/random?glasses,technology)`,
          minHeight: '500px'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.5)',
          }}
        />
        <Grid container>
          <Grid item md={6}>
            <Box
              sx={{
                position: 'relative',
                p: { xs: 3, md: 6 },
                pr: { md: 0 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '500px'
              }}
            >
              <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                Smart Blind Glasses
              </Typography>
              <Typography variant="h5" color="inherit" paragraph>
                A revolutionary monitoring system that helps visually impaired individuals
                navigate the world safely with real-time assistance from caregivers.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  color="inherit"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Features
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Our smart glasses system offers a range of features to enhance safety and independence
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <LocationOn sx={{ fontSize: 80, color: 'primary.main' }} />
                </Box>
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  Real-time Location Tracking
                </Typography>
                <Typography>
                  Caregivers can monitor the location of users in real-time, ensuring they can provide
                  assistance when needed.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Notifications sx={{ fontSize: 80, color: 'primary.main' }} />
                </Box>
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  Emergency Alerts
                </Typography>
                <Typography>
                  One-touch emergency button sends immediate alerts to caregivers with the user's
                  current location.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Speed sx={{ fontSize: 80, color: 'primary.main' }} />
                </Box>
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  Distance Sensing
                </Typography>
                <Typography>
                  Advanced sensors detect obstacles and provide feedback to the user,
                  helping them navigate safely.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            How It Works
          </Typography>
          <Grid container spacing={4} alignItems="center" sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <img 
                src="https://source.unsplash.com/random?blind,technology" 
                alt="Smart Glasses demonstration" 
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AccessibilityNew color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="User wears smart glasses" 
                    secondary="The lightweight glasses come equipped with a distance sensor and GPS tracking" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Real-time data collection" 
                    secondary="The glasses continuously collect distance and location data" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Favorite color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Caregiver monitoring" 
                    secondary="Caregivers can monitor user's location and receive emergency alerts" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Security color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Enhanced safety" 
                    secondary="Emergency button allows users to instantly notify caregivers when help is needed" 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container sx={{ py: 8 }} maxWidth="md">
        <Box sx={{ bgcolor: 'primary.main', p: 6, borderRadius: 2, color: 'white', textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to get started?
          </Typography>
          <Typography variant="subtitle1" paragraph>
            Join our community of users and caregivers to experience enhanced safety and independence.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ mt: 2 }}
          >
            Sign Up Now
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.200', p: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h6" align="center" gutterBottom>
            Smart Blind Glasses Monitoring System
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" component="p">
            Enhancing safety and independence for the visually impaired
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' Smart Glass Monitor. All rights reserved.'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 