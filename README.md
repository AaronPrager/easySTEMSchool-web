# Easy STEM School Website

A modern, responsive one-page website for Easy STEM School, designed to showcase STEM education programs and attract students and parents.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Interactive Elements**: Mobile navigation, smooth scrolling, form validation
- **SEO Optimized**: Semantic HTML structure and meta tags
- **Fast Loading**: Optimized CSS and JavaScript for performance
- **Contact Form**: Functional contact form with validation
- **Accessibility**: WCAG compliant design elements

## File Structure

```
website/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Sections

1. **Navigation**: Fixed header with smooth scrolling navigation
2. **Hero Section**: Eye-catching introduction with call-to-action buttons
3. **About Section**: Key features and benefits of the school
4. **Programs Section**: Detailed information about STEM programs
5. **Testimonials**: Student and parent testimonials
6. **Contact Section**: Contact information and inquiry form
7. **Footer**: Additional links and social media

## Customization Guide

### Colors
The website uses a blue color scheme. To change colors, update these CSS variables in `styles.css`:

```css
/* Primary blue */
#2563eb

/* Secondary blue */
#3b82f6

/* Dark blue */
#1d4ed8

/* Gradient colors */
#667eea to #764ba2
```

### Content Updates

#### Company Information
- Update the company name in the navigation and footer
- Change contact information (address, phone, email)
- Update social media links

#### Programs
Modify the programs section in `index.html` to match your actual offerings:
- Robotics & AI
- Coding & Development
- Science & Engineering
- Mathematics & Logic

#### Testimonials
Replace the sample testimonials with real student and parent feedback.

#### Contact Form
The contact form includes:
- Name (required)
- Email (required)
- Phone (optional)
- Program interest selection
- Message field

### Images and Graphics
Currently uses Font Awesome icons. To add custom images:
1. Create an `images/` folder
2. Add your images
3. Replace icon elements with `<img>` tags
4. Update CSS for image styling

## Deployment

### Local Development
1. Open `index.html` in a web browser
2. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

### Web Hosting
Upload all files to your web hosting provider:
- Shared hosting: Upload via FTP/cPanel
- VPS: Use Git or SCP
- Cloud platforms: Deploy to Netlify, Vercel, or GitHub Pages

### Domain Setup
1. Purchase a domain (e.g., `easystemschool.com`)
2. Point DNS to your hosting provider
3. Update contact information in the website

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

The website is optimized for:
- Fast loading times
- Mobile performance
- SEO best practices
- Accessibility standards

## Form Handling

The contact form currently simulates submission. To make it functional:

### Option 1: Email Service
Use services like Formspree, Netlify Forms, or EmailJS:

```javascript
// Example with Formspree
<form action="https://formspree.io/f/your-form-id" method="POST">
```

### Option 2: Backend Integration
Connect to your own backend:
- PHP mailer
- Node.js with Nodemailer
- Python with Flask/Django

### Option 3: CRM Integration
Connect to CRM systems like:
- HubSpot
- Salesforce
- Mailchimp

## Analytics and Tracking

Add Google Analytics or other tracking:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## SEO Optimization

The website includes:
- Semantic HTML structure
- Meta tags for social sharing
- Alt text for images
- Proper heading hierarchy
- Fast loading times

## Maintenance

### Regular Updates
- Keep content current
- Update testimonials
- Refresh program information
- Monitor form submissions

### Security
- Keep hosting platform updated
- Use HTTPS
- Regular backups
- Monitor for vulnerabilities

## Support

For customization help or technical support:
- Review the code comments
- Check browser console for errors
- Test on multiple devices
- Validate HTML/CSS

## License

This website template is created for Easy STEM School. Customize as needed for your business.

---

**Easy STEM School** - Empowering Future Innovators 