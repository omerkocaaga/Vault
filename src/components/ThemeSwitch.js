"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "@geist-ui/icons";

export default function ThemeSwitch() {
	const { theme, setTheme } = useTheme();

	const options = [
		{
			value: "light",
			icon: <Sun size={16} strokeWidth={2.2} />,
			label: "Light",
		},
		{
			value: "dark",
			icon: <Moon size={16} strokeWidth={2.2} />,
			label: "Dark",
		},
		{
			value: "system",
			icon: <Monitor size={16} strokeWidth={2.2} />,
			label: "System",
		},
	];

	return (
		<div className="flex items-center gap-3.5">
			<div className="flex bg-gray-100 dark:bg-gray-900 rounded-full p-1 gap-1">
				{options.map((opt) => (
					<button
						key={opt.value}
						onClick={() => setTheme(opt.value)}
						className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors focus:outline-none
							${
								theme === opt.value
									? "bg-gray-300 text-gray-900 dark:bg-white dark:text-gray-900 shadow"
									: "text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800"
							}
						`}
						aria-label={opt.label}
					>
						{opt.icon}
					</button>
				))}
			</div>
		</div>
	);
}
