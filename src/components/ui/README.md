# UI Component Library

This directory contains a comprehensive set of reusable UI components built with React, TypeScript, Tailwind CSS, and Heroicons. The components follow modern design patterns and are fully accessible.

## Components

### Core Components

- **Button** - Versatile button component with multiple variants and states
- **Input** - Form input with validation states and icon support
- **Textarea** - Multi-line text input with validation
- **Card** - Container component with header, content, and footer sections
- **Modal** - Overlay dialog with backdrop and focus management
- **Dropdown** - Dropdown menu with click-outside handling
- **Form** - Form wrapper with field components
- **Progress** - Progress indicator for multi-step processes

### Feature Components

- **Navbar** - Navigation bar with authentication and user menu
- **ProjectCard** - Card component for displaying project information
- **PricingModal** - Modal for displaying pricing plans
- **Footer** - Comprehensive footer with company info, links, and social media

## Usage

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Design System

### Colors
The components use CSS custom properties for consistent theming:
- `--primary` - Primary brand color
- `--secondary` - Secondary color
- `--accent` - Accent color
- `--destructive` - Error/danger color
- `--muted` - Muted text color

### Variants
Components support multiple variants:
- `default` - Primary styling
- `outline` - Bordered styling
- `ghost` - Minimal styling
- `destructive` - Error styling
- `reddit` - Reddit brand styling
- `success` - Success styling

### Sizes
Components support different sizes:
- `sm` - Small
- `default` - Default
- `lg` - Large
- `icon` - Icon-only

## Accessibility

All components are built with accessibility in mind:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance

## Styling

Components use Tailwind CSS for styling with:
- Consistent spacing using Tailwind's spacing scale
- Responsive design with mobile-first approach
- Dark mode support
- Smooth transitions and animations

## Icons

Components use Heroicons for consistent iconography:
- Outline icons for most use cases
- Solid icons for filled states
- 24x24px default size
- Accessible with proper labels 