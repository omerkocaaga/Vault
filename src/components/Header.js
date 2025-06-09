import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header({ onLogout, onAddNew, onImportCSV }) {
	const router = useRouter();

	return (
		<header className="flex justify-between items-center py-32">
			<Link href="/" className="flex space-x-4 items-center">
				<div className="w-7 h-7 rounded-full bg-primary"></div>

				<span className="text-2xl tracking-widest font-mono font-light text-gray-900 dark:text-gray-100">
					VAULT
				</span>
			</Link>
			<div className="flex items-center gap-4">
				<Link
					href="/archive"
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					View Archive
				</Link>
				<button
					onClick={onImportCSV}
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Import CSV
				</button>
				<button
					onClick={onAddNew}
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					Add New
				</button>
				<button
					onClick={onLogout}
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
				>
					Logout
				</button>
			</div>
		</header>
	);
}
