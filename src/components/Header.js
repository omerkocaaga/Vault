"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Plus, Menu } from "@geist-ui/icons";
import {
	Menu as HeadlessMenu,
	MenuButton,
	MenuItem,
	MenuItems,
} from "@headlessui/react";
import { useState, useEffect } from "react";
import CommandMenu from "./CommandMenu";
import { useSession } from "./SessionProvider";
import ThemeSwitch from "./ThemeSwitch";

export default function Header({ onLogout, onAddNew, onImportCSV }) {
	const router = useRouter();
	const { session } = useSession();
	const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

	useEffect(() => {
		window.openCommandMenu = () => {
			setIsCommandMenuOpen(true);
		};
		return () => {
			delete window.openCommandMenu;
		};
	}, []);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsCommandMenuOpen(true);
			} else if (e.key === "Escape") {
				setIsCommandMenuOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const pathname = usePathname();
	console.log(pathname);

	return (
		<>
			<header className="flex justify-between items-center xl:py-16 lg:py-12 md:py-10 py-8">
				<div className="flex gap-8 items-center flex-1">
					<Link href="/app" className="flex space-x-4 items-center">
						<div className="w-7 h-7 rounded-full bg-primary"></div>
					</Link>
					<div className="gap-4 hidden lg:flex">
						<Link
							href="/app"
							className={`"hover:text-gray-800 dark:hover:text-gray-100  duration-300 ease-in-out" ${
								pathname === "/app"
									? "text-gray-800 dark:text-gray-100"
									: "text-gray-400 dark:text-gray-600"
							}`}
						>
							Saves
						</Link>
						<Link
							href="/collections"
							className={`"hover:text-gray-800 dark:hover:text-gray-100  duration-300 ease-in-out" ${
								pathname === "/collections"
									? "text-gray-800 dark:text-gray-100"
									: "text-gray-400 dark:text-gray-600"
							}`}
						>
							Collections
						</Link>
					</div>
				</div>
				<button
					onClick={() => setIsCommandMenuOpen(true)}
					className="hidden lg:flex w-auto md:w-auto lg:w-1/3 xl:w-1/3 2xl:w-1/3 bg-gray-100 dark:bg-gray-900 duration-300 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full py-3.5 px-3.5 lg:px-5 items-center justify-between"
				>
					<div className="flex items-center gap-2">
						<span className="text-gray-500 dark:text-gray-500">
							<Search size={20} strokeWidth={2.2} />
						</span>
						<span className="text-sm text-gray-400 dark:text-gray-600 hidden lg:block">
							Search in your saves...
						</span>
					</div>
					<span className="text-sm text-gray-500 dark:text-gray-500 hidden lg:block">
						⌘K
					</span>
				</button>
				<div className="flex items-center justify-end gap-4 lg:gap-8 flex-1">
					<button
						onClick={() => setIsCommandMenuOpen(true)}
						className="w-auto md:w-auto lg:w-1/3 xl:w-1/2 2xl:w-1/3 bg-gray-100 dark:bg-gray-900 duration-300 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full py-3.5 px-3.5 lg:px-5 flex lg:hidden items-center justify-between"
					>
						<span className="text-gray-500 dark:text-gray-500">
							<Search size={20} strokeWidth={2.2} />
						</span>
					</button>
					{pathname !== "/archive" && (
						<div
							onClick={onAddNew}
							className="cursor-pointer duration-300 ease-in-out p-1 flex items-center gap-2 text-gray-500 dark:text-gray-500 p-3.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800"
						>
							<Plus size={20} strokeWidth={2.2} />
						</div>
					)}
					<HeadlessMenu as="div" className="relative">
						<MenuButton className="cursor-pointer duration-300 ease-in-out p-1 flex items-center gap-2 text-gray-500 dark:text-gray-500 p-4 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
							<Menu size={20} strokeWidth={2.2} />
						</MenuButton>
						<MenuItems className="absolute flex flex-col gap-4 right-0 z-10 mt-4 w-64 origin-top-right rounded-2xl border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-950 shadow-xl p-4 focus:outline-none">
							<>
								<MenuItem>
									<Link
										href="/app"
										className="items-center gap-2.5 flex lg:hidden"
									>
										<span className="text-gray-900 dark:text-gray-100 text-base duration-300 ease-in-out hover:text-gray-500 dark:hover:text-gray-500">
											Saves
										</span>
									</Link>
								</MenuItem>
								<MenuItem>
									<Link
										href="/collections"
										className="items-center gap-2.5 flex lg:hidden"
									>
										<span className="text-gray-900 dark:text-gray-100 text-base duration-300 ease-in-out hover:text-gray-500 dark:hover:text-gray-500">
											Collections
										</span>
									</Link>
								</MenuItem>
								<MenuItem>
									<Link href="/archive" className="flex items-center gap-2.5">
										<span className="text-gray-900 dark:text-gray-100 text-base duration-300 ease-in-out hover:text-gray-500 dark:hover:text-gray-500">
											Archive
										</span>
									</Link>
								</MenuItem>
								<MenuItem>
									<Link href="/profile" className="flex items-center gap-2.5">
										<span className="text-gray-900 dark:text-gray-100 text-base duration-300 ease-in-out hover:text-gray-500 dark:hover:text-gray-500">
											Profile
										</span>
									</Link>
								</MenuItem>
								{/* <div className="h-px w-full my-1 bg-gray-700 dark:bg-gray-300"></div> */}
								<MenuItem
									as="button"
									onClick={onImportCSV}
									className="flex items-center gap-2.5"
								>
									<span className="text-gray-900 dark:text-gray-100 text-base duration-300 ease-in-out hover:text-gray-500 dark:hover:text-gray-500">
										Import CSV
									</span>
								</MenuItem>
								<MenuItem
									as="button"
									onClick={onLogout}
									className="flex items-center gap-2.5"
								>
									<span className="text-gray-900 dark:text-gray-100 text-base duration-300 ease-in-out hover:text-gray-500 dark:hover:text-gray-500">
										Logout
									</span>
								</MenuItem>
								<div className="h-px w-full my-1 bg-gray-300 dark:bg-gray-700"></div>
								<div className="flex items-center gap-2.5">
									<span className="text-gray-900 dark:text-gray-100 text-base">
										Theme
									</span>
									<div className="ml-auto" onClick={(e) => e.stopPropagation()}>
										<ThemeSwitch />
									</div>
								</div>
							</>
						</MenuItems>
					</HeadlessMenu>
				</div>
			</header>

			<CommandMenu
				isOpen={isCommandMenuOpen}
				onClose={() => setIsCommandMenuOpen(false)}
			/>
		</>
	);
}
