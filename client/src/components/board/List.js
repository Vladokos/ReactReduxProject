import React, { useState, useRef } from "react";

import { useDispatch } from "react-redux";
import {
  changeName,
  deleteList,
  archiveList,
} from "../../features/lists/listsSlice";

import { Card } from "./Card";

import { CreateCard } from "./CreateCard";

import { Draggable, Droppable } from "react-beautiful-dnd";

import TextareaAutosize from "react-textarea-autosize";

import OutsideClick from "../../hooks/outsideClick";

import dots from "../../img/dots.svg";

import "../../styles/Board/List.css";

export const List = ({
  boards,
  listId,
  listName,
  listCards,
  index,
  cards,
  visibleChangeCard,
  visibleChangeNameCard,
  height,
  socket,
}) => {
  const dispatch = useDispatch();

  const [nameList, setNameList] = useState(null);
  const [actionShow, setActionShow] = useState(false);
  const [cardCreateShow, setCardCreateShow] = useState(false);

  const actionsFrom = useRef(null);
  const nameInput = useRef(null);

  const sendForm = (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      dispatch(changeName({ listId, nameList }));
      e.target.blur();
    }
  };

  const deletingList = () => {
    dispatch(deleteList({ listId }));
  };

  const archivingList = () => {
    dispatch(archiveList({ listId }));
  };

  OutsideClick(actionsFrom, () => setActionShow(false));
  OutsideClick(nameInput, () => nameInput.current.blur());
  return (
    <Draggable key={listId} draggableId={listId} index={index} id={listId}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Droppable droppableId={listId} type="card">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={"list " + listName}
              >
                <div className="list-title">
                  <TextareaAutosize
                    value={nameList === null ? listName : nameList}
                    onChange={(e) => setNameList(e.target.value)}
                    onKeyDown={sendForm}
                    spellCheck="false"
                    ref={nameInput}
                  />
                  <img src={dots} onClick={() => setActionShow(!actionShow)} />
                  <div
                    className={actionShow === false ? "hidden" : "active"}
                    ref={actionsFrom}
                  >
                    <img
                      src={dots}
                      onClick={() => setActionShow(!actionShow)}
                    />
                    <div onClick={archivingList}>Archive list</div>
                    <div onClick={deletingList}>Delete list</div>
                  </div>
                </div>
                <div
                  className="draggable-list"
                  style={{ maxHeight: height - 60 }}
                >
                  {listCards.map((cardId, index) => {
                    return cards.map((card) => {
                      if (card._id === cardId && !card.archived) {
                        return (
                          <Card
                            key={card._id}
                            card={card}
                            index={index}
                            visibleChangeCard={visibleChangeCard}
                            visibleChangeNameCard={visibleChangeNameCard}
                          />
                        );
                      }
                    });
                  })}
                </div>

                {provided.placeholder}
                <div className="listCreate">
                  <button
                    onClick={() => setCardCreateShow(true)}
                    className={listId}
                  >
                    Add a card
                  </button>

                  <CreateCard
                    listId={listId}
                    boards={boards}
                    formShow={cardCreateShow}
                    closeForm={() => setCardCreateShow(false)}
                    socket={socket}
                  />
                </div>
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
};
