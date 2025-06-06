export default function Modal({ isOpen, onClose, title, children }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex min-h-screen items-center justify-center p-4 text-center">
				<div
					className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
					onClick={onClose}
				/>

				<div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
					<div className="sm:flex sm:items-start">
						<div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
							<h3 className="text-lg font-semibold leading-6 text-gray-900">
								{title}
							</h3>
							<div className="mt-4">{children}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
