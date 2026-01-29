import React, { useState } from 'react';
import ModelCard from '../components/ai-video/ModelCard';
import { aiVideoModels, type AIVideoModel } from '../data/aiVideoModels';

const AIVideoModelsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSort, setSelectedSort] = useState<string>('name');

    const categories = [
        { id: 'all', label: 'All Models' },
        { id: 'text-to-video', label: 'Text-to-Video' },
        { id: 'avatar', label: 'Avatar Videos' },
        { id: 'open-source', label: 'Open Source' },
        { id: 'enterprise', label: 'Enterprise' }
    ];

    const sortOptions = [
        { id: 'name', label: 'Name (A-Z)' },
        { id: 'company', label: 'Company' },
        { id: 'release', label: 'Release Date' }
    ];

    const filteredModels = aiVideoModels
        .filter((model) => {
            const matchesSearch =
                model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                model.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                model.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' ||
                (selectedCategory === 'text-to-video' && !model.name.includes('Avatar') && !model.name.includes('Gen')) ||
                (selectedCategory === 'avatar' && model.name.includes('Avatar')) ||
                (selectedCategory === 'open-source' && model.id.includes('stable')) ||
                (selectedCategory === 'enterprise' && model.pricing.includes('$'));

            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (selectedSort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'company':
                    return a.company.localeCompare(b.company);
                case 'release':
                    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
                default:
                    return 0;
            }
        });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-violet-900 text-white">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-sm font-medium">2025 Directory</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                            AI Video Generation Models
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8">
                            Discover the best AI tools for creating stunning videos from text, images, or existing footage.
                            Updated for January 2025.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {aiVideoModels.length} Models Listed
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {new Set(aiVideoModels.map(m => m.company)).size} Companies
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Updated Jan 2025
                            </span>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
            </section>

            {/* Filters Section */}
            <section className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search models, companies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Category:</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Sort:</label>
                                <select
                                    value={selectedSort}
                                    onChange={(e) => setSelectedSort(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    {sortOptions => (
                                        <option key={opt.map((opt).id} value={opt.id}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Models Grid */}
            <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Featured Models</h2>
                        <p className="text-gray-600 mt-1">Showing {filteredModels.length} of {aiVideoModels.length} models</p>
                    </div>
                </div>

                {filteredModels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredModels.map((model) => (
                            <ModelCard key={model.id} model={model} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </section>

            {/* Comparison Section */}
            <section className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Comparison</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Compare key features across top AI video generation platforms</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Model</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Max Duration</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Resolutions</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Starting Price</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Best For</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aiVideoModels.slice(0, 8).map((model, index) => (
                                    <tr key={model.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                            <div className="font-medium">{model.name}</div>
                                            <div className="text-gray-500 text-xs">{model.company}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{model.maxDuration}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{model.supportedResolutions.join(', ')}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{model.pricing.split(',')[0]}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{model.bestFor}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Create AI Videos?</h2>
                    <p className="text-indigo-100 mb-8 text-lg">
                        Start experimenting with these powerful AI video generation tools and bring your creative ideas to life.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['OpenAI Sora', 'Runway Gen-3', 'Luma Dream Machine'].map((model) => (
                            <a
                                key={model}
                                href={aiVideoModels.find(m => m.name === model)?.website || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Try {model}
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-white text-lg font-bold">AI Video Models Directory</h3>
                            <p className="text-sm mt-1">Your guide to the best AI video generation tools</p>
                        </div>
                        <div className="text-sm">
                            Last updated: January 2025
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AIVideoModelsPage;
