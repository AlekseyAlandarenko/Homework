import { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { closeModal, removeProfileAsync, deleteAccountAsync } from '../../store/usersSlice';
import styles from './ConfirmModal.module.css';
import { Button } from '../Button/Button';
import { Paragraph } from '../Paragraph/Paragraph';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { selectUsersModal } from '../../store/usersSelectors';

type ModalData =
  | {
      modalType: 'removeProfile';
      metadata: { account: string; profile: string };
    }
  | {
      modalType: 'deleteAccount';
      metadata: { account: string };
    }
  | {
      modalType: null;
      metadata?: undefined;
    };

export const ConfirmModal: FC = () => {
	const dispatch: AppDispatch = useDispatch();
	const navigate = useNavigate();
	const modal = useSelector(selectUsersModal) as ModalData & { isOpen: boolean };

	const modalRef = useFocusTrap<HTMLDivElement>(modal.isOpen);

	if (!modal.isOpen || !modal.modalType) return null;

	const actionsMap = {
		removeProfile: async (data: { account: string; profile: string }) => {
			await dispatch(removeProfileAsync(data));
		},
		deleteAccount: async (data: { account: string }) => {
			await dispatch(deleteAccountAsync({ login: data.account }));
			navigate('/login');
		}
	};

	const handleConfirm = async () => {
		if (modal.modalType === 'removeProfile') {
			await actionsMap.removeProfile(modal.metadata);
		} else if (modal.modalType === 'deleteAccount') {
			await actionsMap.deleteAccount(modal.metadata);
		}
		dispatch(closeModal());
	};

	const handleCancel = () => dispatch(closeModal());

	const modalContent = (
		<div
			className={styles.overlay}
			role="dialog"
			aria-modal="true"
			ref={modalRef}
			tabIndex={-1}
		>
			<div className={styles['confirm-modal-container']}>
				<Paragraph
					size="large"
					weight="bold"
					className={styles['confirm-modal-message']}
				>
					{modal.modalType === 'removeProfile'
						? TEXT_CONSTANTS.HEADER.CONFIRM_REMOVE_PROFILE
						: TEXT_CONSTANTS.HEADER.CONFIRM_DELETE_ACCOUNT}
				</Paragraph>
				<div className={styles['confirm-modal-buttons']}>
					<Button
						onClick={handleCancel}
						className={styles['confirm-modal-button-cancel']}
						type="button"
					>
						{TEXT_CONSTANTS.BUTTONS.CANCEL}
					</Button>
					<Button
						onClick={handleConfirm}
						className={styles['confirm-modal-button-confirm']}
						type="button"
					>
						{TEXT_CONSTANTS.BUTTONS.DELETE}
					</Button>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};