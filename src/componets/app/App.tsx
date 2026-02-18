import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import type { FetchNotesParams } from '../../services/noteService';
import { fetchNotes, createNote, deleteNote } from '../../services/noteService';
import NoteList from '../NoteList/NoteList';
import Pagination from '../Pagination/Pagination';
import Modal from '../Modal/Modal';
import NoteForm from '../NoteForm/NoteForm';
import SearchBox from '../SearchBox/SearchBox';
import type { NoteFormValues } from '../NoteForm/NoteForm';
import css from './App.module.css';

const ITEMS_PER_PAGE = 12;

function App() {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const debouncedHandleSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      debouncedHandleSearch(value);
    },
    [debouncedHandleSearch]
  );

  const { data: notesData, isError, error } = useQuery({
    queryKey: ['notes', page, debouncedSearch],
    queryFn: async () => {
      const params: FetchNotesParams = {
        page,
        perPage: ITEMS_PER_PAGE,
        ...(debouncedSearch && { search: debouncedSearch }),
      };
      const response = await fetchNotes(params);
      return response.data;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (values: NoteFormValues) => {
      return createNote({
        title: values.title,
        content: values.content,
        tag: values.tag,
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setPage(1);
      setSearchValue('');
      setDebouncedSearch('');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => {
      return deleteNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handlePageChange = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити цю нотатку?')) {
      await deleteNoteMutation.mutateAsync(id);
    }
  };

  const handleCreateNoteSubmit = async (values: NoteFormValues) => {
    await createNoteMutation.mutateAsync(values);
  };

  const totalPages = notesData?.totalPages || 0;

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <button
          className={css.button}
          onClick={() => setIsModalOpen(true)}
          disabled={createNoteMutation.isPending}
        >
          Create note +
        </button>
        <SearchBox value={searchValue} onChange={handleSearchChange} />
      </header>

      <main>
        {isError && (
          <div style={{ color: 'red', padding: '16px', marginBottom: '16px' }}>
            Помилка завантаження: {error instanceof Error ? error.message : 'Невідома помилка'}
          </div>
        )}
        <NoteList notes={notesData?.notes || []} onDelete={handleDeleteNote} />
        <Pagination
          pageCount={Math.max(0, totalPages)}
          currentPage={page}
          onPageChange={handlePageChange}
        />
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Create New Note</h2>
        <NoteForm
          onSubmit={handleCreateNoteSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createNoteMutation.isPending}
        />
      </Modal>
    </div>
  );
}

export default App;
