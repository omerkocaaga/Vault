import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header({ onLogout, onAddNew, onImportCSV }) {
	const router = useRouter();

	return (
		<header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<Link
						href="/"
						className="text-2xl font-bold text-gray-900 hover:text-indigo-600"
					>
						Vault
					</Link>
					<div className="flex items-center gap-4">
						<Link
							href="/archive"
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							View Archive
						</Link>
						<button
							onClick={onImportCSV}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
				</div>
			</div>
		</header>
	);
}
