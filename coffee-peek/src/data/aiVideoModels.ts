export interface AIVideoModel {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  website: string;
  pricing: string;
  keyFeatures: string[];
  strengths: string[];
  bestFor: string;
  imageUrl: string;
  releaseDate: string;
  company: string;
  supportedResolutions: string[];
  maxDuration: string;
  styleOptions: string[];
}

export const aiVideoModels: AIVideoModel[] = [
  {
    id: "openai-sora",
    name: "OpenAI Sora",
    description:
      "OpenAI's text-to-video AI model capable of generating realistic and imaginative video scenes up to 60 seconds long. Sora understands complex physics and creates stunning visual content from simple text prompts.",
    shortDescription: "OpenAI's most advanced text-to-video AI model",
    website: "https://openai.com/sora",
    pricing: "Currently in research preview, pricing TBA",
    keyFeatures: [
      "Up to 60-second video generation",
      "Complex scene understanding",
      "Realistic physics simulation",
      "Multiple character interactions",
      "Camera movement control",
    ],
    strengths: ["High realism", "Long duration", "Complex physics"],
    bestFor: "Professional filmmakers and content creators",
    imageUrl:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    releaseDate: "February 2024",
    company: "OpenAI",
    supportedResolutions: ["1080p", "720p"],
    maxDuration: "60 seconds",
    styleOptions: ["Realistic", "Cinematic", "Documentary"],
  },
  {
    id: "runway-gen3",
    name: "Runway Gen-3 Alpha",
    description:
      "Runway's latest text-to-video model featuring dramatic improvements in consistency, fidelity, and motion. Gen-3 Alpha enables creators to generate high-quality video with fine-grained control over timing and motion.",
    shortDescription: "Next-generation AI video with advanced control",
    website: "https://runwayml.com",
    pricing: "Free tier available, Pro plans from $12/month",
    keyFeatures: [
      "10-second video generation",
      "Motion brush controls",
      "Camera motion presets",
      "Consistent character generation",
      "Video interpolation",
    ],
    strengths: ["User-friendly", "Strong community", "Frequent updates"],
    bestFor: "Creative professionals and indie filmmakers",
    imageUrl:
      "https://images.unsplash.com/photo-1535016120720-40c6874c3b13?w=400&h=300&fit=crop",
    releaseDate: "June 2024",
    company: "Runway",
    supportedResolutions: ["720p", "1080p", "4K"],
    maxDuration: "10 seconds",
    styleOptions: ["Realistic", "Animated", "Stylized"],
  },
  {
    id: "luma-dream-machine",
    name: "Luma Dream Machine",
    description:
      "Dream Machine is an AI video generator designed for creative professionals, offering high-quality video generation with emphasis on visual storytelling and artistic control.",
    shortDescription: "Creative AI video for visual storytelling",
    website: "https://lumalabs.ai/dream-machine",
    pricing: "Free tier available, Premium plans from $9.99/month",
    keyFeatures: [
      "5-second video clips",
      "Image-to-video conversion",
      "Style transfer options",
      "Fast generation times",
      "Commercial licensing",
    ],
    strengths: ["Fast processing", "Commercial use", "Image-to-video"],
    bestFor: "Social media creators and marketers",
    imageUrl:
      "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=300&fit=crop",
    releaseDate: "June 2024",
    company: "Luma AI",
    supportedResolutions: ["720p", "1080p"],
    maxDuration: "5 seconds",
    styleOptions: ["Realistic", "Artistic", "Dreamlike"],
  },
  {
    id: "kling-ai",
    name: "Kling AI",
    description:
      "Kling AI is a powerful text-to-video generator from Kuaishou that creates high-quality, realistic videos up to 2 minutes long. It excels at understanding complex prompts and generating smooth, natural motion.",
    shortDescription: "Long-form AI video generator",
    website: "https://klingai.com",
    pricing: "Free credits available, subscription plans from $10/month",
    keyFeatures: [
      "Up to 2-minute videos",
      "High-fidelity output",
      "Multi-shot consistency",
      "Natural language prompts",
      "Background preservation",
    ],
    strengths: ["Long duration", "High quality", "Chinese company"],
    bestFor: "Content creators needing longer videos",
    imageUrl:
      "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=300&fit=crop",
    releaseDate: "June 2024",
    company: "Kuaishou",
    supportedResolutions: ["1080p", "4K"],
    maxDuration: "2 minutes",
    styleOptions: ["Realistic", "Cinematic", "Natural"],
  },
  {
    id: "meta-movie-gen",
    name: "Meta Movie Gen",
    description:
      "Meta's Movie Gen represents a breakthrough in AI video generation, offering capabilities for creating, editing, and personalizing video content with unprecedented quality and control.",
    shortDescription: "Meta's comprehensive AI media suite",
    website: "https://ai.meta.com/movie-gen",
    pricing: "Research preview, commercial use TBA",
    keyFeatures: [
      "Text-to-video generation",
      "Video editing capabilities",
      "Personalized content",
      "Audio generation",
      "High-quality output",
    ],
    strengths: ["Comprehensive toolkit", "Meta ecosystem", "Research-backed"],
    bestFor: "Researchers and Meta ecosystem users",
    imageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
    releaseDate: "October 2024",
    company: "Meta",
    supportedResolutions: ["720p", "1080p", "4K"],
    maxDuration: "16 seconds",
    styleOptions: ["Realistic", "Various artistic styles"],
  },
  {
    id: "google-veo",
    name: "Google Veo",
    description:
      "Google's Veo is a state-of-the-art video generation model that creates high-quality, coherent video from text prompts. It features advanced understanding of visual concepts and natural language.",
    shortDescription: "Google's advanced video generation AI",
    website: "https://deepmind.google/veo",
    pricing: "Limited preview, pricing TBA",
    keyFeatures: [
      "8-second video generation",
      "High coherence and quality",
      "Natural language understanding",
      "Video editing capabilities",
      "Google Cloud integration",
    ],
    strengths: ["Google integration", "High quality", "Research excellence"],
    bestFor: "Enterprise users and Google ecosystem",
    imageUrl:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
    releaseDate: "May 2024",
    company: "Google DeepMind",
    supportedResolutions: ["720p", "1080p"],
    maxDuration: "8 seconds",
    styleOptions: ["Realistic", "Cinematic", "Documentary"],
  },
  {
    id: "pika-labs",
    name: "Pika Labs",
    description:
      "Pika Labs has emerged as a leading platform for AI video generation, offering intuitive tools for creating and editing videos from text, images, or existing videos with remarkable ease.",
    shortDescription: "User-friendly AI video platform",
    website: "https://pika.art",
    pricing: "Free tier available, Pro from $8/month",
    keyFeatures: [
      "Text-to-video generation",
      "Image-to-video conversion",
      "Video editing tools",
      "Style customization",
      "Community features",
    ],
    strengths: ["Easy to use", "Strong community", "Fast iterations"],
    bestFor: "Beginners and social media creators",
    imageUrl:
      "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop",
    releaseDate: "November 2023",
    company: "Pika Labs",
    supportedResolutions: ["720p", "1080p"],
    maxDuration: "4 seconds",
    styleOptions: ["Animated", "Realistic", "Artistic"],
  },
  {
    id: "stability-stable-video",
    name: "Stable Video Diffusion",
    description:
      "Stability AI's Stable Video Diffusion brings the power of open-source AI video generation to everyone. Built on the same principles as Stable Diffusion, it offers transparent, community-driven development.",
    shortDescription: "Open-source AI video generation",
    website: "https://stability.ai/stable-video-diffusion",
    pricing: "Free (open source), Cloud API pricing varies",
    keyFeatures: [
      "Open-source model",
      "Image-to-video conversion",
      "Video interpolation",
      "Custom training options",
      "Local deployment",
    ],
    strengths: ["Open source", "Customizable", "Community-driven"],
    bestFor: "Developers and privacy-conscious users",
    imageUrl:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop",
    releaseDate: "November 2023",
    company: "Stability AI",
    supportedResolutions: ["576x1024", "1024x576"],
    maxDuration: "2-4 seconds",
    styleOptions: ["Various", "Customizable"],
  },
  {
    id: "synthesia",
    name: "Synthesia",
    description:
      "Synthesia specializes in AI-generated avatar videos for enterprise use. It's the leading platform for creating professional videos with AI presenters in over 140 languages.",
    shortDescription: "AI avatar video platform for enterprises",
    website: "https://synthesia.io",
    pricing: "From $30/month",
    keyFeatures: [
      "140+ language support",
      "AI avatars",
      "Custom avatar creation",
      "Template library",
      "Team collaboration",
    ],
    strengths: ["Enterprise-ready", "Language support", "Avatars"],
    bestFor: "Corporate training and marketing videos",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop",
    releaseDate: "2017",
    company: "Synthesia",
    supportedResolutions: ["720p", "1080p"],
    maxDuration: "Unlimited",
    styleOptions: ["Professional", "Corporate"],
  },
  {
    id: "heygen",
    name: "HeyGen",
    description:
      "HeyGen is an AI video platform that creates talking avatar videos from text. It's widely used for marketing, training, and communication content with customizable avatars.",
    shortDescription: "AI talking avatar videos",
    website: "https://heygen.com",
    pricing: "Free trial, from $24/month",
    keyFeatures: [
      "Talking avatars",
      "Voice cloning",
      "Instant translation",
      "Custom avatars",
      "Integration support",
    ],
    strengths: ["Avatar quality", "Translation", "Quick turnaround"],
    bestFor: "Marketing and multilingual content",
    imageUrl:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
    releaseDate: "2020",
    company: "HeyGen",
    supportedResolutions: ["720p", "1080p"],
    maxDuration: "Unlimited",
    styleOptions: ["Professional", "Casual"],
  },
  {
    id: "kaiber",
    name: "Kaiber",
    description:
      "Kaiber is an AI video generation platform focused on creative and artistic video content. It's popular among musicians and artists for creating music videos and visual art.",
    shortDescription: "Creative AI video for artists",
    website: "https://kaiber.ai",
    pricing: "Free tier, Pro from $5.99/month",
    keyFeatures: [
      "Text-to-video generation",
      "Image-to-video conversion",
      "Artistic styles",
      "Music visualization",
      "Artist-friendly interface",
    ],
    strengths: ["Artistic focus", "Music videos", "Creative tools"],
    bestFor: "Artists and musicians",
    imageUrl:
      "https://images.unsplash.com/photo-1514525253440-b393452e23f0?w=400&h=300&fit=crop",
    releaseDate: "2022",
    company: "Kaiber",
    supportedResolutions: ["720p", "1080p"],
    maxDuration: "30 seconds",
    styleOptions: ["Artistic", "Animated", "Stylized"],
  },
  {
    id: "stable-horizon",
    name: "Stable Horizon",
    description:
      "Stable Horizon is an open-source video generation model that focuses on creating coherent, high-quality video content with an emphasis on temporal consistency and visual fidelity.",
    shortDescription: "Open-source coherent video generation",
    website: "https://github.com/Stable-Horizon",
    pricing: "Free (open source)",
    keyFeatures: [
      "Text-to-video generation",
      "Image-to-video conversion",
      "Video extension",
      "Custom model training",
      "Community support",
    ],
    strengths: ["Open source", "Coherent motion", "Extensible"],
    bestFor: "Developers and researchers",
    imageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop",
    releaseDate: "2024",
    company: "Community",
    supportedResolutions: ["576x1024", "1024x576"],
    maxDuration: "4-8 seconds",
    styleOptions: ["Various", "Customizable"],
  },
];
