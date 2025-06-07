import Modal from "./Modal";

export default function DeleteConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	itemTitle,
	isDeleting,
}) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Delete Item">
			<div className="mt-2">
				<p className="text-sm text-gray-500">
					Are you sure you want to delete &quot;{itemTitle}&quot;? This action
					cannot be undone.
				</p>
			</div>

			<div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
				<button
					type="button"
					className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
					onClick={onConfirm}
					disabled={isDeleting}
				>
					{isDeleting ? (
						<span className="flex items-center">
							<svg
								className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Deleting...
						</span>
					) : (
						"Delete"
					)}
				</button>
				<button
					type="button"
					className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
					onClick={onClose}
					disabled={isDeleting}
				>
					Cancel
				</button>
			</div>
		</Modal>
	);
}
