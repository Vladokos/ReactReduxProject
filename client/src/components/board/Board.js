import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DragDropContext, Droppable } from "react-beautiful-dnd";

import { useSelector, useDispatch } from "react-redux";
import { getBoard, changeLists } from "../../features/boards/boardsSlice";
import {
  getLists,
  sortingLists,
  changeCards,
} from "../../features/lists/listsSlice";
import { getCards } from "../../features/card/cardsSlice";

import axios from "axios";

import useWindowHeight from "../../hooks/heightWindowHook";

import { Header } from "../blanks/Header";
import { BoardName } from "./BoardName";
import { List } from "./List";
import { CreateList } from "./CreateList";
import { CreateCard } from "./CreateCard";
import { ChangeCard } from "./ChangeCard";
import { ChangeNameCard } from "./ChangeNameCard";
import { Menu } from "./Menu";

export const Board = () => {
  const navigate = useNavigate();
  const params = useParams();

  const { height } = useWindowHeight();

  const dispatch = useDispatch();
  const { boards } = useSelector((state) => state.boards);
  const { lists } = useSelector((state) => state.lists);
  const { cards } = useSelector((state) => state.cards);

  const [cardFormShow, setCardFormShow] = useState(false);
  const [changeCard, setChangeCard] = useState(false);
  const [changeNameCard, setChangeNameCard] = useState(false);

  const [nameCard, setNameCard] = useState("");
  const [descriptionCard, setDescriptionCard] = useState("");

  const [listId, setListId] = useState(null);
  const [cardId, setCardId] = useState(null);

  const [xPos, setXPos] = useState(null);
  const [yPos, setYPos] = useState(null);

  const visibleCardCreate = (e) => {
    setListId(e.target.className);

    setXPos(e.target.getBoundingClientRect().x);
    setYPos(e.target.getBoundingClientRect().y);

    setCardFormShow(true);
  };

  const visibleChangeCard = (e, id, description) => {
    if (e.target.innerText === "") return null;
    setCardId(id);

    setNameCard(e.target.innerText);
    setDescriptionCard(description);

    setChangeCard(true);
  };

  const visibleChangeNameCard = (e, nameCard, id) => {
    setNameCard(nameCard);

    setCardId(id);

    setXPos(e.target.getBoundingClientRect().x);
    setYPos(e.target.getBoundingClientRect().y);

    setChangeNameCard(true);
  };

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");

    const { boardId } = params;

    if (accessToken === "undefined" || accessToken === null) navigate("/sig");

    axios({
      config: {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
      method: "POST",
      url: "/token/verify",
      data: {
        accessToken: JSON.parse(accessToken),
      },
    })
      .then((response) => {
        if (response.status === 200) {
          dispatch(getLists(boardId));
          dispatch(getBoard(boardId));
          dispatch(getCards(boardId));
        }
      })
      .catch((error) => {
        if (error.response.data === "Error" || error.response.status === 400) {
          navigate("/error/404");
        }
      });
  }, []);

  const onDrop = (e) => {
    if (e.type === "list") {
      const position = e.destination.index;
      const { boardId } = params;
      const currentListId = e.draggableId;

      dispatch(changeLists({ position, boardId, currentListId }));
    } else if (e.type === "card") {
      const fromListId = e.source.droppableId;
      const toListId = e.destination.droppableId;
      const position = e.destination.index;
      const cardId = e.draggableId;

      dispatch(changeCards({ fromListId, toListId, position, cardId }));
    }
  };

  useEffect(() => {
    if (boards.length > 0) {
      dispatch(sortingLists(boards));
    }
  }, [boards]);

  return (
    <div className="boardMenu" style={{ height: height }}>
      <Header />
      <div className="lists" style={{ height: height - 127 }}>
        <div className="container">
          <div className="lists__inner" style={{ height: height - 200 }}>
            <div className="action-board">
              {boards.map((board) => (
                <BoardName key={board._id} name={board.nameBoard} />
              ))}
              <Menu />
            </div>

            <ul className="scrollBoard">
              <DragDropContext onDragEnd={onDrop}>
                <Droppable
                  droppableId="lists"
                  direction="horizontal"
                  type="list"
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="sheetList"
                    >
                      {lists.map((list, index) =>
                        !list.archived ? (
                          <List
                            key={listId + index}
                            listId={list._id}
                            listName={list.nameList}
                            listCards={list.cards}
                            index={index}
                            cards={cards}
                            visibleCardCreate={visibleCardCreate}
                            visibleChangeCard={visibleChangeCard}
                            visibleChangeNameCard={visibleChangeNameCard}
                            height={height - 307}
                          />
                        ) : null
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <CreateList />

              <CreateCard
                xPos={xPos}
                yPos={yPos}
                listId={listId}
                boards={boards}
                moveForm={() => setYPos(yPos + 55)}
                formShow={cardFormShow}
                closeForm={() => setCardFormShow(false)}
                height={height - 340}
              />
            </ul>
            <ChangeCard
              nameCard={nameCard}
              descriptionCard={descriptionCard}
              changeDescription={(e) => setDescriptionCard(e.target.value)}
              cardId={cardId}
              changeCard={(e) => setNameCard(e.target.value)}
              isOpen={changeCard}
              closeForm={() => setChangeCard(false)}
            />

            {changeNameCard === false ? null : (
              <ChangeNameCard
                nameCard={nameCard}
                changeNameCard={(e) => setNameCard(e.target.value)}
                cardId={cardId}
                closeForm={() => setChangeNameCard(false)}
                xPos={xPos}
                yPos={yPos}
                height={height - 270}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
