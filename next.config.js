/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		turbo: {
			rules: {
				// Configure Turbopack rules
				"*.css": ["postcss"],
			},
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
			{
				protocol: "http",
				hostname: "**",
			},
		],
	},
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
				child_process: false,
				http: false,
				https: false,
				zlib: false,
				path: false,
				stream: false,
				util: false,
				crypto: false,
				url: false,
				string_decoder: false,
				buffer: false,
				process: false,
			};
		}
		return config;
	},
};

module.exports = nextConfig;
