import React from 'react';
import type { AIVideoModel } from '../../data/aiVideoModels';

interface ModelCardProps {
    model: AIVideoModel;
}

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="relative h-48 overflow-hidden">
                <img
                    src={model.imageUrl}
                    alt={model.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                    {model.company}
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{model.name}</h3>
                        <span className="text-xs text-gray-500">Released: {model.releaseDate}</span>
                    </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{model.shortDescription}</p>

                <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap gap-1">
                        {model.styleOptions.slice(0, 3).map((style) => (
                            <span key={style} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md">
                                {style}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>⏱ {model.maxDuration}</span>
                        <span>📺 {model.supportedResolutions[0]}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Key Features</h4>
                    <ul className="space-y-1">
                        {model.keyFeatures.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="text-indigo-500 mt-0.5">•</span>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {model.strengths.map((strength) => (
                        <span key={strength} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-md">
                            {strength}
                        </span>
                    ))}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {model.pricing.split(',')[0]}
                        </span>
                        <a
                            href={model.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Visit Website
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelCard;
