# Simple Text Editor

A modern, clean text editor built with Next.js, React, and TypeScript featuring real-time auto-save, multiple themes, and an intuitive writing experience.

![Text Editor Dashboard - Dark Theme](./images/Screenshot%202025-07-19%20192756.png)

## ✨ Features

- **🎨 Dual Theme Support**: Beautiful light and dark themes for comfortable writing in any environment
- **📝 Real-time Auto-save**: Your work is automatically saved as you type - never lose your progress
- **🔤 Multiple Font Options**: Choose from Inter, Serif, Mono, and other carefully selected fonts
- **📊 Live Statistics**: Real-time word and character counting to track your progress
- **🎯 Distraction-free Interface**: Clean, minimal design that keeps you focused on writing
- **🔍 Document Search**: Quickly find and access your documents with built-in search
- **⚡ Fast Performance**: Built with modern web technologies for lightning-fast performance
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

## 🖼️ Screenshots

### Dashboard View
![Light Theme Dashboard](./images/Screenshot%202025-07-19%20192747.png)
*Clean dashboard with document management and quick actions*

### Editor Interface
![Editor Interface](./images/Screenshot%202025-07-19%20192813.png)
*Distraction-free writing environment with formatting tools*

### Advanced Features
![Notion-like Editor](./images/Screenshot%202025-07-19%20192443.png)
*Advanced editing features with block-style formatting*

## 🚀 Tech Stack

- **Frontend**: Next.js 15.2.4, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Theme Management**: next-themes
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: Built-in React state with custom hooks

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** 18.18 or later
- **npm**, **yarn**, **pnpm**, or **bun** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd simple-text-editor
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Creating Documents
1. Click the **"New Document"** button from the dashboard
2. Start typing in the editor - your document will auto-save
3. Use the formatting toolbar for basic text styling

### Editor Features
- **Auto-save**: Documents save automatically every few seconds
- **Font Selection**: Choose your preferred font from the dropdown menu
- **Word Count**: Monitor your progress with real-time statistics
- **Theme Toggle**: Switch between light and dark themes using the theme button

### Keyboard Shortcuts
- **Ctrl/Cmd + S**: Manual save
- **Ctrl/Cmd + B**: Bold text
- **Ctrl/Cmd + I**: Italic text

## 📁 Project Structure

```
simple-text-editor/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── images/               # Project screenshots
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── tailwind.config.ts    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

## 🎨 Customization

### Adding New Fonts
Modify the font options in your editor component:

```typescript
const FONTS = [
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Serif", value: "serif" },
  { name: "Mono", value: "monospace" },
  { name: "Your Custom Font", value: "YourFont, sans-serif" }
];
```

### Theming
The application uses next-themes for theme management. Customize themes in your Tailwind configuration or component styles.

### Auto-save Interval
Adjust the auto-save frequency by modifying the timeout value in your editor component.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms
The application can be deployed to any platform that supports Next.js applications.

## 🔒 Data Storage

Currently, documents are stored locally in the browser. For persistent storage across devices, consider integrating:

- **Supabase** for database storage
- **Vercel KV** for key-value storage
- **Local file system** for desktop applications

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
- Next.js will automatically find an available port
- Or specify a custom port: `npm run dev -- -p 3001`

**Dependencies Issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build Errors**
- Ensure you're using Node.js 18.18 or later
- Check TypeScript errors with `npm run lint`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Writing! ✍️**
```

